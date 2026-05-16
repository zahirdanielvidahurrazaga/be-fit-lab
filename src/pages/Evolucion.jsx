import React, { useState } from 'react';
import { Activity, Flame, User, Calendar, Utensils, TrendingUp, Award, Target, ChevronRight, QrCode, Zap, Droplets } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { motion } from 'framer-motion';

function Evolucion() {
  const navigate = useNavigate();
  const { user, classesRemaining } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const isScrolled = useScrollDetect(30);

  const score = 94;
  const circumference = 2 * Math.PI * 70; // radius 70
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="mobile-app-container" style={{ background: '#FCF9F5' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingTop: '20px', paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Tu progreso</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Evolución</h1>
          </div>
          <div style={{ 
            width: '42px', height: '42px', borderRadius: '50%', 
            background: 'rgba(255,139,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ paddingTop: '10px' }}>
        <div className="dashboard-sidebar">

          {/* PROGRESS RING — HERO */}
          <motion.section initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{duration:0.6}}>
            <div style={{ 
              background: 'white', borderRadius: '32px', padding: '30px 20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)',
              textAlign: 'center', position: 'relative', overflow: 'hidden'
            }}>
              {/* Decorative glow */}
              <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,139,66,0.08) 0%, transparent 70%)', borderRadius: '50%' }}></div>

              {/* SVG Ring */}
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 20px' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle cx="90" cy="90" r="70" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="10" />
                  {/* Progress circle */}
                  <circle 
                    cx="90" cy="90" r="70" fill="none" 
                    stroke="url(#progressGradient)" strokeWidth="10" 
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF8B42" />
                      <stop offset="100%" stopColor="#EEBA89" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center content */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: '5px' }}>
                Has superado el <span style={{ fontWeight: 800, color: 'var(--primary)' }}>85%</span> de tus objetivos
              </div>
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,139,66,0.08)', padding: '6px 14px', borderRadius: '12px',
                fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <Award size={14} /> Nivel PRO
              </div>
            </div>
          </motion.section>

          {/* BADGES */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.15}} style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Insignias</h2>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '5px' }}>
               <BadgeIcon icon="🔥" label="7 Días" />
               <BadgeIcon icon="🧘" label="Flow Pro" />
               <BadgeIcon icon="💪" label="Fuerza" />
               <BadgeIcon icon="🥗" label="Foodie" />
               <BadgeIcon icon="⭐" label="VIP" />
            </div>
          </motion.section>
        </div>

        <div className="dashboard-content">
          {/* BODY METRICS — CLEAN LIST STYLE */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.2}}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '15px', fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Composición</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MetricRow label="Peso" value="62.4" unit="kg" trend="-0.5" icon={<Droplets size={18} />} />
              <MetricRow label="Grasa" value="21.8" unit="%" trend="-1.2" icon={<Flame size={18} />} />
              <MetricRow label="Músculo" value="32.1" unit="%" trend="+1.5" icon={<Zap size={18} />} positive />
              <MetricRow label="Cadera" value="94.5" unit="cm" trend="+0.8" icon={<Target size={18} />} positive />
            </div>
          </motion.section>

          {/* WEEKLY CHART */}
          <motion.section initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.5, delay:0.3}} style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', color: 'var(--black)' }}>Actividad semanal</h2>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(255,139,66,0.08)', padding: '4px 10px', borderRadius: '8px' }}>+12%</div>
            </div>
            <div style={{ 
              background: 'white', borderRadius: '24px', padding: '20px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)'
            }}>
              <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '100%', maxWidth: '28px', margin: '0 auto',
                      height: `${h}%`, 
                      background: i === 3 ? 'linear-gradient(to top, var(--primary), var(--accent))' : 'rgba(0,0,0,0.04)', 
                      borderRadius: '8px',
                      boxShadow: i === 3 ? '0 4px 12px rgba(255,139,66,0.3)' : 'none'
                    }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: i === 3 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                      {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {showQR && (
        <>
          <div className="qr-sheet-overlay" onClick={() => setShowQR(false)} />
          <div className="qr-bottom-sheet" style={{ padding: '12px 24px 20px', background: 'var(--surface)' }}>
            <div className="sheet-handle" />
            <div className="wallet-card" style={{ 
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FCF9F5 100%)', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.9)',
              position: 'relative', overflow: 'hidden',
              margin: '0 auto 10px', width: '100%', borderRadius: '30px'
            }}>
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }}></div>
              <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0, paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(255,139,66,0.3)' }}>B</div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BEFIT LAB</span>
                </div>
                <QrCode size={20} color="var(--primary)" opacity={0.8} />
              </div>
              <div className="wallet-body" style={{ padding: '25px 20px', textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.02)' }}>
                  <QRCodeCanvas value={user?.id || 'befit-client-id'} size={160} level={"H"} includeMargin={false} fgColor="#2D2928" />
                </div>
              </div>
              <div className="wallet-footer" style={{ borderTop: '1px dashed rgba(0,0,0,0.05)', paddingTop: '20px', paddingBottom: '20px', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Clases Disponibles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--black)', fontFamily: 'var(--font-display)' }}>{classesRemaining} <span style={{fontSize: '0.9rem', fontWeight: 500, color: 'var(--primary)'}}>sesiones</span></div>
                </div>
              </div>
            </div>
            <div className="sheet-user-info" style={{ marginTop: '10px' }}>
              <div className="user-name">{user?.user_metadata?.full_name || 'Miembro BeFit'}</div>
              <div>{user?.email}</div>
            </div>
          </div>
        </>
      )}

      <nav className={`ios-bottom-nav ${isScrolled ? 'scrolled' : ''}`}>
        <Link to="/portal" className="nav-item"><User size={22} strokeWidth={2.5} /><span>Yo</span></Link>
        <Link to="/evolucion" className="nav-item active"><TrendingUp size={22} strokeWidth={2.5} /><span>Metas</span></Link>
        <button className="nav-qr-button" onClick={() => setShowQR(true)}><QrCode size={24} strokeWidth={2.5} /></button>
        <Link to="/nutricion" className="nav-item"><Utensils size={22} strokeWidth={2.5} /><span>Comida</span></Link>
        <Link to="/agenda" className="nav-item"><Calendar size={22} strokeWidth={2.5} /><span>Clases</span></Link>
      </nav>
    </div>
  );
}

/* BADGE ICON */
function BadgeIcon({ icon, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      <div style={{ 
        width: '56px', height: '56px', borderRadius: '50%', 
        background: 'white', border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', boxShadow: '0 6px 18px rgba(0,0,0,0.04)'
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{label}</span>
    </div>
  );
}

/* METRIC ROW — Clean list item */
function MetricRow({ label, value, unit, trend, icon, positive }) {
  const isUp = trend.startsWith('+');
  return (
    <div style={{ 
      background: 'white', borderRadius: '20px', padding: '16px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 6px 18px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ 
          width: '42px', height: '42px', borderRadius: '14px', 
          background: positive ? 'rgba(255,139,66,0.08)' : 'rgba(0,0,0,0.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: positive ? 'var(--primary)' : 'var(--on-surface-variant)'
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--black)', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{unit}</span>
          </div>
        </div>
      </div>
      <div style={{ 
        fontSize: '0.7rem', fontWeight: 800, 
        color: isUp ? (positive ? 'var(--primary)' : '#22C55E') : 'var(--primary)',
        background: isUp ? (positive ? 'rgba(255,139,66,0.08)' : 'rgba(34,197,94,0.08)') : 'rgba(255,139,66,0.08)',
        padding: '5px 10px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', gap: '3px'
      }}>
        {isUp ? '↑' : '↓'} {trend.replace('+', '').replace('-', '')}{unit}
      </div>
    </div>
  );
}

export default Evolucion;
