import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Resumen financiero REAL desde Stripe (solo ADMIN). Devuelve ingresos brutos/netos,
// comisiones, conteo, serie por día, desglose por tipo (membresías vs cafetería) y
// las transacciones recientes. Montos en MXN (ya divididos /100).
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Verificar que quien llama sea ADMIN
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: 'No autenticado' }, { status: 401, headers: corsHeaders });
    const { data: prof } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (prof?.role !== 'ADMIN') return Response.json({ error: 'Solo admin' }, { status: 403, headers: corsHeaders });

    // Periodo: o bien `days` (últimos N días, como siempre) o bien un rango de
    // calendario `from`/`to` ('YYYY-MM-DD', ambos incluidos) — Brenda pidió poder
    // ver "del 1 al 30 de octubre". Las fechas se cortan en HORA DE MÉXICO
    // (UTC-6 fijo desde 2022, sin horario de verano): antes se cortaba en UTC y
    // un cobro de las 7 pm caía en el día siguiente.
    const body = await req.json().catch(() => ({}));
    const MX_OFFSET_MS = 6 * 3600 * 1000;
    const esFecha = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    // Día de México de un instante (ms) → 'YYYY-MM-DD'
    const diaMx = (ms: number) => new Date(ms - MX_OFFSET_MS).toISOString().slice(0, 10);
    // Medianoche de México de un 'YYYY-MM-DD' → ms
    const inicioDiaMx = (d: string) => Date.parse(`${d}T00:00:00Z`) + MX_OFFSET_MS;

    let sinceMs: number, untilMs: number;
    if (esFecha(body.from) && esFecha(body.to) && body.from <= body.to) {
      sinceMs = inicioDiaMx(body.from);
      untilMs = Math.min(inicioDiaMx(body.to) + 86400000, Date.now() + 60000);
    } else {
      const nDias = Math.max(1, Math.min(Number(body.days) || 90, 3700));
      untilMs = Date.now() + 60000;
      sinceMs = inicioDiaMx(diaMx(Date.now())) - (nDias - 1) * 86400000;
    }
    if (untilMs <= sinceMs) {
      return Response.json({ error: 'El rango empieza en el futuro' }, { status: 400, headers: corsHeaders });
    }
    if (untilMs - sinceMs > 3700 * 86400000) {
      return Response.json({ error: 'Rango demasiado largo (máximo 10 años)' }, { status: 400, headers: corsHeaders });
    }
    const since = Math.floor(sinceMs / 1000);
    const until = Math.floor(untilMs / 1000);
    // Días de calendario cubiertos (para la gráfica)
    const days = Math.max(1, Math.round((inicioDiaMx(diaMx(untilMs - 1)) - sinceMs) / 86400000) + 1);

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // Traer cargos del periodo (hasta ~3,000), con balance_transaction (fee/net) y PI (metadata)
    let charges: any[] = [];
    let startingAfter: string | undefined;
    let cargosIncompletos = false;
    for (let i = 0; i < 30; i++) {
      const page = await stripe.charges.list({
        created: { gte: since, lt: until }, limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ['data.balance_transaction', 'data.payment_intent'],
      });
      charges = charges.concat(page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1].id;
      if (i === 29) cargosIncompletos = true;
    }

    // IDs de PaymentIntent que corresponden a pedidos de cafetería (clasificación
    // robusta: cubre web (Checkout) y nativo, presentes y pasados, sin depender
    // de que la metadata del PI esté presente).
    const { data: cafeOrders } = await supabase.from('cafe_orders').select('payment_intent_id').not('payment_intent_id', 'is', null);
    const cafePIs = new Set((cafeOrders || []).map((o: any) => o.payment_intent_id));
    const { data: eventRegs } = await supabase.from('event_registrations').select('payment_intent_id').not('payment_intent_id', 'is', null);
    const eventPIs = new Set((eventRegs || []).map((o: any) => o.payment_intent_id));

    const mxn = (c: number) => Math.round((c || 0)) / 100;
    const piIdOf = (ch: any) => typeof ch.payment_intent === 'string' ? ch.payment_intent : ch.payment_intent?.id;
    type Tipo = 'cafeteria' | 'membresia' | 'evento' | 'inscripcion' | 'clase_suelta';
    const typeOf = (ch: any): Tipo => {
      const t = ch.payment_intent?.metadata?.type || ch.metadata?.type;
      if (t === 'inscripcion' || t === 'clase_suelta') return t;
      if (t === 'event' || eventPIs.has(piIdOf(ch))) return 'evento';
      if (t === 'cafeteria' || cafePIs.has(piIdOf(ch))) return 'cafeteria';
      return 'membresia';
    };

    let gross = 0, net = 0, fees = 0, count = 0, refunded = 0;
    const byDay: Record<string, number> = {};
    const byType: Record<string, number> = { cafeteria: 0, membresia: 0, evento: 0, mostrador: 0, inscripcion: 0, clase_suelta: 0 };
    const recent: any[] = [];

    for (const ch of charges) {
      if (ch.status !== 'succeeded' || !ch.paid) continue;
      const amount = mxn(ch.amount);
      const refundedAmt = mxn(ch.amount_refunded);
      const bt = ch.balance_transaction;
      gross += amount;
      refunded += refundedAmt;
      if (bt && typeof bt === 'object') { fees += mxn(bt.fee); net += mxn(bt.net); }
      count++;
      const day = diaMx(ch.created * 1000);
      byDay[day] = (byDay[day] || 0) + amount;
      const t = typeOf(ch);
      byType[t] += amount;
      recent.push({
        id: ch.id,
        amount,
        created: ch.created,
        type: t,
        email: ch.billing_details?.email || ch.receipt_email || '',
        status: ch.refunded ? 'refunded' : 'succeeded',
      });
    }

    // Ventas de MOSTRADOR (cobros manuales: efectivo/tarjeta/transferencia).
    // No tienen comisión de Stripe → suman igual a bruto y neto.
    const sinceISO = new Date(sinceMs).toISOString();
    const untilISO = new Date(untilMs).toISOString();
    // voided=true son ventas ANULADAS desde Auditoría (duplicadas/erróneas):
    // no cuentan como ingreso. client_name es el snapshot al momento del cobro
    // (sobrevive aunque la cuenta de la clienta se borre después).
    const { data: manualSales } = await supabase
      .from('sales')
      .select('id, amount, method, created_at, plan_name, client_name, client_email, users:user_id(full_name,email)')
      .eq('voided', false)
      .gte('created_at', sinceISO).lt('created_at', untilISO)
      .order('created_at', { ascending: false }).limit(10000);
    for (const s of (manualSales || [])) {
      const amt = Number(s.amount) || 0;
      if (amt <= 0) continue;
      gross += amt; net += amt; count++;
      const day = diaMx(new Date(s.created_at).getTime());
      byDay[day] = (byDay[day] || 0) + amt;
      // Inscripción y clase suelta cobradas en el estudio se separan del resto
      // del mostrador (que son membresías cobradas en efectivo/terminal).
      const tipo = s.plan_name === 'Inscripción anual' ? 'inscripcion'
        : s.plan_name === 'Clase suelta' ? 'clase_suelta' : 'mostrador';
      byType[tipo] += amt;
      recent.push({
        id: 's_' + s.id, amount: amt,
        created: Math.floor(new Date(s.created_at).getTime() / 1000),
        type: tipo,
        email: s.users?.full_name || s.users?.email || s.client_name || s.client_email || (s.method ? 'Pago en ' + s.method : ''),
        status: 'succeeded',
      });
    }

    // Serie adaptable al rango: hasta 31 barras (diarias si el rango es corto,
    // agrupadas en bloques si es largo). Cada barra suma sus días (de México).
    const step = Math.max(1, Math.ceil(days / 31));
    const series: { date: string; amount: number }[] = [];
    const diaN = (n: number) => diaMx(sinceMs + n * 86400000 + 43200000); // mediodía del día n
    for (let i = 0; i < days; i += step) {
      let sum = 0;
      for (let d = i; d < Math.min(days, i + step); d++) sum += byDay[diaN(d)] || 0;
      series.push({ date: diaN(i), amount: Math.round(sum) });
    }

    return Response.json({
      currency: 'MXN',
      mode: (Deno.env.get('STRIPE_SECRET_KEY') || '').startsWith('sk_live') ? 'live' : 'test',
      gross: Math.round(gross), net: Math.round(net), fees: Math.round(fees),
      refunded: Math.round(refunded), count,
      byType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v)])),
      from: diaMx(sinceMs), to: diaMx(untilMs - 1), days, incompleto: cargosIncompletos,
      series, recent: recent.sort((a, b) => b.created - a.created).slice(0, 60),
      avgTicket: count ? Math.round(gross / count) : 0,
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-analytics error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
