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

    const { days = 90 } = await req.json().catch(() => ({}));
    const since = Math.floor(Date.now() / 1000) - days * 86400;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    // Traer cargos del periodo (hasta ~400), con balance_transaction (fee/net) y PI (metadata)
    let charges: any[] = [];
    let startingAfter: string | undefined;
    for (let i = 0; i < 4; i++) {
      const page = await stripe.charges.list({
        created: { gte: since }, limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ['data.balance_transaction', 'data.payment_intent'],
      });
      charges = charges.concat(page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1].id;
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
    const typeOf = (ch: any): 'cafeteria' | 'membresia' | 'evento' => {
      const t = ch.payment_intent?.metadata?.type || ch.metadata?.type;
      if (t === 'event' || eventPIs.has(piIdOf(ch))) return 'evento';
      if (t === 'cafeteria' || cafePIs.has(piIdOf(ch))) return 'cafeteria';
      return 'membresia';
    };

    let gross = 0, net = 0, fees = 0, count = 0, refunded = 0;
    const byDay: Record<string, number> = {};
    const byType: Record<string, number> = { cafeteria: 0, membresia: 0, evento: 0, mostrador: 0 };
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
      const day = new Date(ch.created * 1000).toISOString().slice(0, 10);
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
    const sinceISO = new Date(since * 1000).toISOString();
    const { data: manualSales } = await supabase
      .from('sales')
      .select('id, amount, method, created_at, plan_name, users:user_id(full_name,email)')
      .gte('created_at', sinceISO).order('created_at', { ascending: false });
    for (const s of (manualSales || [])) {
      const amt = Number(s.amount) || 0;
      if (amt <= 0) continue;
      gross += amt; net += amt; count++;
      const day = new Date(s.created_at).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + amt;
      byType.mostrador += amt;
      recent.push({
        id: 's_' + s.id, amount: amt,
        created: Math.floor(new Date(s.created_at).getTime() / 1000),
        type: 'mostrador',
        email: s.users?.full_name || s.users?.email || (s.method ? 'Pago en ' + s.method : ''),
        status: 'succeeded',
      });
    }

    // Serie adaptable al rango: hasta 30 barras (diarias si el rango es corto,
    // agrupadas en bloques si es largo). Cada barra suma sus días.
    const step = Math.max(1, Math.ceil(days / 30));
    const buckets = Math.ceil(days / step);
    const series: { date: string; amount: number }[] = [];
    for (let i = buckets - 1; i >= 0; i--) {
      let sum = 0; let label = '';
      for (let d = 0; d < step; d++) {
        const offset = i * step + d;
        const key = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
        if (d === 0) label = key;
        sum += byDay[key] || 0;
      }
      series.push({ date: label, amount: Math.round(sum) });
    }

    return Response.json({
      currency: 'MXN',
      mode: (Deno.env.get('STRIPE_SECRET_KEY') || '').startsWith('sk_live') ? 'live' : 'test',
      gross: Math.round(gross), net: Math.round(net), fees: Math.round(fees),
      refunded: Math.round(refunded), count,
      byType: { cafeteria: Math.round(byType.cafeteria), membresia: Math.round(byType.membresia), evento: Math.round(byType.evento), mostrador: Math.round(byType.mostrador) },
      series, recent: recent.sort((a, b) => b.created - a.created).slice(0, 25),
      avgTicket: count ? Math.round(gross / count) : 0,
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-analytics error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
