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

    const mxn = (c: number) => Math.round((c || 0)) / 100;
    const typeOf = (ch: any): 'cafeteria' | 'membresia' => {
      const t = ch.payment_intent?.metadata?.type || ch.metadata?.type;
      return t === 'cafeteria' ? 'cafeteria' : 'membresia';
    };

    let gross = 0, net = 0, fees = 0, count = 0, refunded = 0;
    const byDay: Record<string, number> = {};
    const byType: Record<string, number> = { cafeteria: 0, membresia: 0 };
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
      if (recent.length < 25) {
        recent.push({
          id: ch.id,
          amount,
          created: ch.created,
          type: t,
          email: ch.billing_details?.email || ch.receipt_email || '',
          status: ch.refunded ? 'refunded' : 'succeeded',
        });
      }
    }

    // Serie por día de los últimos 30 días (rellena días sin ventas en 0)
    const series: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      series.push({ date: d, amount: Math.round((byDay[d] || 0)) });
    }

    return Response.json({
      currency: 'MXN',
      mode: (Deno.env.get('STRIPE_SECRET_KEY') || '').startsWith('sk_live') ? 'live' : 'test',
      gross: Math.round(gross), net: Math.round(net), fees: Math.round(fees),
      refunded: Math.round(refunded), count,
      byType: { cafeteria: Math.round(byType.cafeteria), membresia: Math.round(byType.membresia) },
      series, recent,
      avgTicket: count ? Math.round(gross / count) : 0,
    }, { headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('admin-analytics error:', message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
