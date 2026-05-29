import React, { useState, useEffect } from 'react';
import { Activity, Flame, User, Calendar, Utensils, TrendingUp, Award, Target, ChevronRight, QrCode, Zap, Droplets, Scale, RefreshCw, Heart, Clock, Wallet, X, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { useHealth } from '../hooks/useHealth';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';

const isNative = Capacitor.isNativePlatform();

function Evolucion() {
  const navigate = useNavigate();
  const { user, classesRemaining, avatarUrl, customBadges, badgeConfigs, profileName } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const walletPlatform = getWalletPlatform();
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletAdded, setWalletAdded] = useState(() => !!localStorage.getItem('befit_wallet_added'));
  const [walletError, setWalletError] = useState(null);

  const handleAddToWallet = async () => {
    if (!user?.id || walletLoading) return;
    setWalletLoading(true);
    setWalletError(null);
    const result = walletPlatform === 'google'
      ? await addToGoogleWallet(user.id)
      : await addToAppleWallet(user.id);
    setWalletLoading(false);
    if (result.success) {
      setWalletAdded(true);
      localStorage.setItem('befit_wallet_added', '1');
    } else {
      setWalletError(result.reason || 'Error desconocido');
    }
  };

  const [latestMeasurement, setLatestMeasurement] = useState(null);
  const [previousMeasurement, setPreviousMeasurement] = useState(null);
  const [loadingMeasurements, setLoadingMeasurements] = useState(true);
  const isScrolled = useScrollDetect(30);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const { healthData, healthPermission, healthLoading, requestPermissions, fetchTodayData } = useHealth();

  const [classHistory, setClassHistory] = useState([]);
  const [badges, setBadges] = useState([{ icon: '🔒', label: 'Cargando...' }]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);

  // Calcular score basado en clases restantes y mediciones disponibles
  const score = latestMeasurement ? Math.min(99, 70 + Math.round((classesRemaining / 30) * 20) + 4) : 72;
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (score / 100) * circumference;

  // Cargar las últimas dos mediciones para calcular tendencias
  useEffect(() => {
    if (!user) return;
    fetchMeasurements();
    fetchClassHistory();
  }, [user]);

  const calculateBadges = (history) => {
    let calculated = [];

    // Evaluar reglas dinámicas del Admin
    if (badgeConfigs) {
      badgeConfigs.forEach(rule => {
        let isEarned = false;
        
        // Si el usuario la tiene asignada manualmente, automáticamente la gana
        if (customBadges?.some(cb => cb.label === rule.label)) {
          isEarned = true;
        } else {
          switch(rule.rule_type) {
            case 'TOTAL_CLASSES':
              isEarned = (history?.length || 0) >= rule.rule_value;
              break;
            case 'DIFFERENT_COACHES':
              const coaches = new Set((history || []).map(h => h.classes?.instructor).filter(Boolean));
              isEarned = coaches.size >= rule.rule_value;
              break;
            case 'PROFILE_COMPLETE':
              isEarned = !!(profileName && profileName.trim() !== '' && avatarUrl);
              break;
            case 'WEEKLY_CLASSES':
              const weekCounts = {};
              (history || []).forEach(h => {
                 const d = new Date(h.created_at);
                 // Aproximación: agrupación por semana (1000*60*60*24*7)
                 const weekKey = `${d.getFullYear()}-${Math.floor(d.getTime() / (1000*60*60*24*7))}`;
                 weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
              });
              const maxWeekly = Math.max(0, ...Object.values(weekCounts));
              isEarned = maxWeekly >= rule.rule_value;
              break;
            case 'MANUAL':
              // Se cubre con el chequeo previo de customBadges
              break;
          }
        }

        calculated.push({
          ...rule,
          locked: !isEarned
        });
      });
    }

    // Añadir insignias manuales extra que no estén en las reglas
    if (customBadges) {
      customBadges.forEach(cb => {
        // Ignorar los objetos que son solo marcadores internos del sistema (sin label ni icon)
        if (!cb.label && cb._internal_notified_id) return;
        if (!cb.label && !cb.icon) return;

        if (!calculated.some(c => c.label === cb.label)) {
          calculated.push({ ...cb, locked: false });
        }
      });
    }

    setBadges(calculated);
  };

  const calculateWeeklyActivity = (history) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const activity = [];
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const classesOnDay = history.filter(item => {
        const itemDate = new Date(item.created_at);
        itemDate.setHours(0,0,0,0);
        return itemDate.getTime() === d.getTime();
      }).length;
      
      let height = classesOnDay * 50; 
      if (height > 100) height = 100;
      
      activity.push({
        label: dayNames[d.getDay()],
        height: height,
        isToday: i === 0,
        count: classesOnDay
      });
    }
    setWeeklyActivity(activity);
  };

  const fetchClassHistory = async () => {
    try {
      const { data } = await supabase
        .from('reservations')
        .select('*, classes(title, time, day)')
        .eq('user_id', user.id)
        .eq('checked_in', true)
        .order('created_at', { ascending: false });
        
      if (data) {
        setClassHistory(data);
        calculateWeeklyActivity(data);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  useEffect(() => {
    calculateBadges(classHistory);
  }, [classHistory, customBadges, badgeConfigs, profileName, avatarUrl]);

  const fetchMeasurements = async () => {
    setLoadingMeasurements(true);
    try {
      const { data } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(2);

      if (data?.length >= 1) setLatestMeasurement(data[0]);
      if (data?.length >= 2) setPreviousMeasurement(data[1]);
    } catch (err) {
      console.error('Error cargando mediciones:', err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const calcTrend = (key, unit = '') => {
    if (!latestMeasurement || !previousMeasurement) return null;
    const curr = latestMeasurement[key];
    const prev = previousMeasurement[key];
    if (curr == null || prev == null) return null;
    const diff = (curr - prev).toFixed(1);
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };

  const hasData = !!latestMeasurement;

  return (
    <div className="mobile-app-container">
      {/* HEADER */}
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Tu progreso</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Evolución</h1>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingTop: '10px' }}>
        <div className="dashboard-sidebar">

          {/* PROGRESS RING */}
          <motion.section initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
            <div style={{
              background: 'var(--app-surface-solid)', borderRadius: '32px', padding: '30px 20px',
              boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)',
              textAlign: 'center', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,139,66,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 20px' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="90" cy="90" r="70" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                  <circle cx="90" cy="90" r="70" fill="none" stroke="url(#progressGradient)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF8B42" />
                      <stop offset="100%" stopColor="#EEBA89" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: '5px' }}>
                Has superado el <span style={{ fontWeight: 800, color: 'var(--primary)' }}>85%</span> de tus objetivos
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,139,66,0.08)', padding: '6px 14px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Award size={14} /> Nivel PRO
              </div>
            </div>
          </motion.section>

          {/* BADGES */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Insignias</h2>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '10px' }}>
              {badges.length > 0 ? badges.map((b, i) => (
                <BadgeIcon key={i} icon={b.icon} label={b.label} locked={b.locked} onClick={() => setSelectedBadge(b)} />
              )) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No hay insignias configuradas aún.</p>
              )}
            </div>
          </motion.section>
        </div>

        <div className="dashboard-content">
          {/* COMPOSICIÓN CORPORAL */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Composición</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasData && latestMeasurement?.measured_at && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                    {new Date(latestMeasurement.measured_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <button onClick={fetchMeasurements} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {!hasData && !loadingMeasurements ? (
              /* Estado vacío — próximamente */
              <div style={{
                background: 'var(--app-surface-solid)', borderRadius: '24px', padding: '28px 20px',
                boxShadow: 'var(--card-shadow)', border: '1px dashed var(--border-subtle)',
                textAlign: 'center'
              }}>
                <Scale size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 4px' }}>Composición corporal</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 12px' }}>
                  Próximamente podrás conectar tu báscula inteligente para ver tus métricas de composición corporal.
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,139,66,0.1)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: '99px', letterSpacing: '0.05em' }}>
                  <Clock size={12} /> PRÓXIMAMENTE
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <MetricRow
                  label="Peso"
                  value={latestMeasurement?.weight_kg?.toFixed(1) ?? '—'}
                  unit="kg"
                  trend={calcTrend('weight_kg')}
                  icon={<Scale size={18} />}
                  positiveIsDown
                />
                <MetricRow
                  label="Grasa corporal"
                  value={latestMeasurement?.body_fat_pct?.toFixed(1) ?? '—'}
                  unit="%"
                  trend={calcTrend('body_fat_pct')}
                  icon={<Flame size={18} />}
                  positiveIsDown
                />
                <MetricRow
                  label="Masa muscular"
                  value={latestMeasurement?.muscle_pct?.toFixed(1) ?? '—'}
                  unit="%"
                  trend={calcTrend('muscle_pct')}
                  icon={<Zap size={18} />}
                  positive
                />
                <MetricRow
                  label="Agua"
                  value={latestMeasurement?.water_pct?.toFixed(1) ?? '—'}
                  unit="%"
                  trend={calcTrend('water_pct')}
                  icon={<Droplets size={18} />}
                  positive
                />
                <MetricRow
                  label="Masa ósea"
                  value={latestMeasurement?.bone_mass_kg?.toFixed(2) ?? '—'}
                  unit="kg"
                  trend={calcTrend('bone_mass_kg')}
                  icon={<Activity size={18} />}
                  positive
                />
                {latestMeasurement?.bmi && (
                  <MetricRow
                    label="IMC"
                    value={latestMeasurement.bmi.toFixed(1)}
                    unit=""
                    trend={calcTrend('bmi')}
                    icon={<Target size={18} />}
                    positiveIsDown
                  />
                )}
              </div>
            )}
          </motion.section>

          {/* BOTÓN BÁSCULA — próximamente */}
          {hasData && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} style={{ marginTop: '16px' }}>
              <div style={{
                width: '100%', padding: '15px', borderRadius: '20px',
                background: 'var(--app-surface-solid)', boxShadow: 'var(--card-shadow)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: 'var(--on-surface-variant)', fontWeight: 700, fontSize: '0.9rem',
                fontFamily: 'var(--font-body)', opacity: 0.6
              }}>
                <Scale size={18} /> Conexión con báscula — <span style={{ color: 'var(--primary)', opacity: 1 }}>Próximamente</span>
              </div>
            </motion.section>
          )}

          {/* ACTIVIDAD SEMANAL */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Actividad semanal</h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(255,139,66,0.08)', padding: '4px 10px', borderRadius: '8px' }}>
                {classHistory.length} clases totales
              </div>
            </div>
            <div style={{ background: 'var(--app-surface-solid)', borderRadius: '24px', padding: '20px', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                {weeklyActivity.length > 0 ? weeklyActivity.map((dayData, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '100%', maxWidth: '28px', margin: '0 auto', height: `${Math.max(dayData.height, 5)}%`,
                      background: dayData.isToday ? 'linear-gradient(to top, var(--primary), var(--accent))' : (dayData.height > 0 ? '#EEBA89' : 'var(--border-subtle)'),
                      borderRadius: '8px', boxShadow: dayData.isToday ? '0 4px 12px rgba(255,139,66,0.3)' : 'none',
                      opacity: dayData.height === 0 && !dayData.isToday ? 0.4 : 1
                    }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: dayData.isToday ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                      {dayData.label}
                    </span>
                  </div>
                )) : (
                  [40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '100%', maxWidth: '28px', margin: '0 auto', height: `${h}%`,
                        background: i === 6 ? 'linear-gradient(to top, var(--primary), var(--accent))' : 'var(--border-subtle)',
                        borderRadius: '8px', boxShadow: i === 6 ? '0 4px 12px rgba(255,139,66,0.3)' : 'none'
                      }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: i === 6 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.section>

          {/* SALUD HOY — HealthKit / Health Connect */}
          {isNative && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} style={{ marginTop: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Salud hoy</h2>
                {healthPermission && (
                  <button onClick={fetchTodayData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <RefreshCw size={15} />
                  </button>
                )}
              </div>

              {!healthPermission ? (
                <div
                  onClick={requestPermissions}
                  style={{
                    background: 'var(--app-surface-solid)', borderRadius: '24px', padding: '28px 20px',
                    boxShadow: 'var(--card-shadow)', border: '1px dashed var(--primary)',
                    textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <Heart size={36} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 4px' }}>
                    {Capacitor.getPlatform() === 'android' ? 'Conecta Health Connect' : 'Conecta Apple Health'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                    Toca para ver tus pasos, calorías y frecuencia cardíaca
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <MetricRow
                    label="Pasos"
                    value={healthLoading ? '—' : (healthData.steps != null ? healthData.steps.toLocaleString('es-MX') : '—')}
                    unit=""
                    icon={<Activity size={18} />}
                    positive
                  />
                  <MetricRow
                    label="Calorías"
                    value={healthLoading ? '—' : (healthData.calories ?? '—')}
                    unit="kcal"
                    icon={<Flame size={18} />}
                    positive
                  />
                  <MetricRow
                    label="Frec. cardíaca"
                    value={healthLoading ? '—' : (healthData.heartRate ?? '—')}
                    unit="bpm"
                    icon={<Heart size={18} />}
                    positive
                  />
                </div>
              )}
            </motion.section>
          )}
        </div>
      </main>

      {/* QR SHEET */}
      {showQR && (
        <>
          <div className="qr-sheet-overlay" onClick={() => setShowQR(false)} />
          <div className="qr-bottom-sheet" style={{ padding: '12px 24px 20px', background: 'var(--surface)' }}>
            <div className="sheet-handle" />
            <div className="wallet-card" style={{ background: 'var(--surface-low)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', margin: '0 auto 10px', width: '100%', borderRadius: '30px' }}>
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }} />
              <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0, paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(255,139,66,0.3)', flexShrink: 0 }}><img src="/logo2.png" alt="Be Fit Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BE FIT LAB</span>
                </div>
                <QrCode size={20} color="var(--primary)" opacity={0.8} />
              </div>
              <div className="wallet-body" style={{ padding: '25px 20px', textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <QRCodeCanvas value={user?.id || 'befit-client-id'} size={160} level="H" includeMargin={false} fgColor="#2D2928" />
                </div>
              </div>
              <div className="wallet-footer" style={{ borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '20px', paddingBottom: '20px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Clases Disponibles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{classesRemaining} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)' }}>sesiones</span></div>
                </div>
              </div>
            </div>
            <div className="sheet-user-info" style={{ marginTop: '10px', textAlign: 'center' }}>
              <div className="user-name" style={{ fontWeight: 800 }}>{user?.user_metadata?.full_name || 'Miembro Be Fit'}</div>
              <div style={{ color: 'var(--on-surface-variant)' }}>{user?.email}</div>
            </div>

            {walletPlatform === 'apple' && (
              <>
                <button
                  onClick={handleAddToWallet}
                  disabled={walletLoading}
                  style={{
                    marginTop: '16px', width: '100%', padding: '14px',
                    borderRadius: '14px', border: 'none', cursor: walletLoading ? 'default' : 'pointer',
                    background: walletAdded ? '#1a1a1a' : '#000000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'opacity 0.2s', opacity: walletLoading ? 0.7 : 1,
                  }}
                >
                  <Wallet size={18} color="white" />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}>
                    {walletLoading ? 'Generando…' : walletAdded ? 'Actualizar Wallet' : 'Agregar a Apple Wallet'}
                  </span>
                </button>
                {walletError && (
                  <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#EF4444', textAlign: 'center' }}>
                    {walletError}
                  </p>
                )}
              </>
            )}
            {walletPlatform === 'google' && (
              <>
                <button
                  onClick={handleAddToWallet}
                  disabled={walletLoading}
                  style={{
                    marginTop: '16px', width: '100%', padding: '14px',
                    borderRadius: '14px', border: 'none', cursor: walletLoading ? 'default' : 'pointer',
                    background: '#1a73e8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'opacity 0.2s', opacity: walletLoading ? 0.7 : 1,
                  }}
                >
                  <Wallet size={18} color="white" />
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}>
                    {walletLoading ? 'Generando…' : 'Agregar a Google Wallet'}
                  </span>
                </button>
                {walletError && (
                  <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#EF4444', textAlign: 'center' }}>
                    {walletError}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/portal" className="nav-item">
          {avatarUrl ? (
            <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--on-surface-variant)', flexShrink: 0 }}>
              <img src={avatarUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <User size={22} strokeWidth={2.5} />
          )}
          <span>Yo</span>
        </Link>
        <Link to="/evolucion" className="nav-item active"><TrendingUp size={22} strokeWidth={2.5} /><span>Metas</span></Link>
        <button className="nav-qr-button" onClick={() => setShowQR(true)}><QrCode size={24} strokeWidth={2.5} /></button>
        <Link to="/nutricion" className="nav-item"><Utensils size={22} strokeWidth={2.5} /><span>Comida</span></Link>
        <Link to="/agenda" className="nav-item"><Calendar size={22} strokeWidth={2.5} /><span>Clases</span></Link>
      </nav>

      {/* BADGE MODAL */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
              zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--app-surface-solid)', borderRadius: '32px', padding: '40px 30px',
                width: '100%', maxWidth: '340px', textAlign: 'center', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--surface-low)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} color="var(--on-surface)" />
              </button>

              <div style={{
                width: '100px', height: '100px', margin: '0 auto 20px', borderRadius: '50%',
                background: selectedBadge.locked ? 'var(--surface)' : 'rgba(255,139,66,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
                border: '2px solid', borderColor: selectedBadge.locked ? 'var(--border-subtle)' : 'var(--primary)',
                filter: selectedBadge.locked ? 'grayscale(100%)' : 'none', opacity: selectedBadge.locked ? 0.6 : 1,
                boxShadow: selectedBadge.locked ? 'none' : '0 10px 25px rgba(255,139,66,0.2)'
              }}>
                {selectedBadge.icon}
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '0 0 10px', color: 'var(--black)' }}>
                {selectedBadge.label}
              </h3>
              
              {selectedBadge.locked ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--surface)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: '15px' }}>
                  🔒 INSIGNIA BLOQUEADA
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, color: '#22C55E', marginBottom: '15px' }}>
                  <Check size={14} /> ¡DESBLOQUEADA!
                </div>
              )}

              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: 0 }}>
                {selectedBadge.description || (() => {
                  switch(selectedBadge.rule_type) {
                    case 'TOTAL_CLASSES': return `Asiste a ${selectedBadge.rule_value} clase${selectedBadge.rule_value > 1 ? 's' : ''} en total.`;
                    case 'DIFFERENT_COACHES': return `Entrena con ${selectedBadge.rule_value} coaches diferentes.`;
                    case 'WEEKLY_CLASSES': return `Asiste a ${selectedBadge.rule_value} clases en una sola semana.`;
                    case 'PROFILE_COMPLETE': return `Completa tu perfil agregando tu nombre y foto.`;
                    case 'MANUAL': return `Insignia especial otorgada por el equipo Be Fit.`;
                    default: return `Participa en la comunidad Be Fit.`;
                  }
                })()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BadgeIcon({ icon, label, locked, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0, opacity: locked ? 0.4 : 1, filter: locked ? 'grayscale(100%)' : 'none', position: 'relative' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--app-surface-solid)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)', maxWidth: '70px', textAlign: 'center', lineHeight: 1.1 }}>{label}</span>
      {locked && <div style={{ position: 'absolute', top: '0px', right: '0px', background: 'var(--surface)', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', fontSize: '0.7rem' }}>🔒</div>}
    </div>
  );
}

function MetricRow({ label, value, unit, trend, icon, positive, positiveIsDown }) {
  const isUp = trend?.startsWith('+');
  const isGood = positive ? isUp : positiveIsDown ? !isUp : isUp;
  const goodColor = '#22C55E';
  const badColor = 'var(--primary)';

  return (
    <div style={{ background: 'var(--app-surface-solid)', borderRadius: '20px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: positive ? 'rgba(255,139,66,0.08)' : 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: positive ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>{value}</span>
            {unit && <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{unit}</span>}
          </div>
        </div>
      </div>
      {trend && (
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isGood ? goodColor : badColor, background: isGood ? 'rgba(34,197,94,0.08)' : 'rgba(255,139,66,0.08)', padding: '5px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          {isUp ? '↑' : '↓'} {trend.replace('+', '').replace('-', '')}{unit}
        </div>
      )}
    </div>
  );
}

export default Evolucion;
