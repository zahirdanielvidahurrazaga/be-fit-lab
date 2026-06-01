import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Salad, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PRIMARY = '#FF914D';
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const buildCells = (year, month) => {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
};

export default function ClientMealPlan({ userId }) {
  const [plan, setPlan] = useState(null);
  const [cal, setCal] = useState(new Date());
  const [daysMap, setDaysMap] = useState({});
  const [selDay, setSelDay] = useState(ymd(new Date()));

  useEffect(() => {
    if (!userId) return;
    supabase.from('nutrition_plans').select('plan_name, calories').eq('user_id', userId).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setPlan(data || null));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const y = cal.getFullYear(), m = cal.getMonth();
    const first = ymd(new Date(y, m, 1)), last = ymd(new Date(y, m + 1, 0));
    supabase.from('meal_plan_days').select('date, meals').eq('user_id', userId).gte('date', first).lte('date', last)
      .then(({ data }) => { const map = {}; (data || []).forEach(d => { map[d.date] = d.meals || []; }); setDaysMap(map); });
  }, [userId, cal]);

  const y = cal.getFullYear(), m = cal.getMonth();
  const cells = buildCells(y, m);
  const today = new Date();
  const hasAnyMeals = useMemo(() => Object.values(daysMap).some(v => v?.length), [daysMap]);
  const selMeals = daysMap[selDay] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header del plan (real, estilo premium oscuro) */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '24px', borderRadius: '28px', background: 'linear-gradient(135deg, #2D2928 0%, #4A4544 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 18px 38px rgba(0,0,0,0.15)' }}>
        <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '130px', height: '130px', background: 'rgba(255,145,77,0.18)', borderRadius: '50%', filter: 'blur(34px)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Salad size={14} color={PRIMARY} />
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Tu plan nutricional</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'white', margin: '0 0 4px', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            {plan?.plan_name || 'Plan personalizado'}
          </h2>
          {plan?.calories
            ? <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Objetivo: <span style={{ color: PRIMARY, fontWeight: 800 }}>{plan.calories} kcal</span> / día</div>
            : <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Tu coach diseñará tu plan a la medida.</div>}
        </div>
      </motion.div>

      {/* Calendario mensual de comidas */}
      <div style={{ background: 'var(--app-surface-solid, #fff)', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => setCal(new Date(y, m - 1, 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface)' }}><ChevronLeft size={17} /></button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: 'var(--on-surface)' }}>{MESES[m]} {y}</div>
          <button onClick={() => setCal(new Date(y, m + 1, 1))} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface)' }}><ChevronRight size={17} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center', marginBottom: '5px' }}>
          {WEEKDAYS.map((w, i) => <span key={i} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{w}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {cells.map((d, i) => {
            if (d === null) return <span key={i} />;
            const key = ymd(new Date(y, m, d));
            const meals = daysMap[key];
            const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
            const isSel = key === selDay;
            return (
              <button key={i} onClick={() => setSelDay(key)} style={{ minHeight: '46px', borderRadius: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer',
                background: isSel ? 'rgba(255,145,77,0.16)' : meals?.length ? 'rgba(255,145,77,0.07)' : 'transparent', border: isToday ? `1.5px solid ${PRIMARY}` : '1.5px solid transparent' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: meals?.length ? 800 : 500, color: meals?.length ? PRIMARY : 'var(--on-surface)' }}>{d}</span>
                {meals?.length > 0 && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: PRIMARY }} />}
              </button>
            );
          })}
        </div>

        {/* Comidas del día seleccionado */}
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--on-surface-variant)', marginBottom: '10px' }}>
            {new Date(selDay + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={selDay} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selMeals.length === 0
                ? <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.86rem', margin: '4px 0' }}>{hasAnyMeals ? 'Sin comidas para este día.' : 'Aún no tienes comidas asignadas este mes.'}</p>
                : selMeals.map((meal, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,145,77,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: PRIMARY, textTransform: 'uppercase', background: 'rgba(255,145,77,0.14)', padding: '3px 8px', borderRadius: '7px', flexShrink: 0 }}>{meal.time}</span>
                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--on-surface)', fontSize: '0.9rem' }}>{meal.title}</span>
                    {meal.kcal ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}><Flame size={12} color={PRIMARY} /> {meal.kcal}</span> : null}
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
