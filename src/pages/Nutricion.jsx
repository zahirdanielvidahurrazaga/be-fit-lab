import React, { useState, useEffect } from 'react';
import { ChefHat, Flame, Clock, User, Calendar, Utensils, TrendingUp, CheckCircle2, Droplets, Play, QrCode, ChevronRight, Heart, Info, Scale, Wallet, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useScrollDetect } from '../hooks/useScrollDetect';
import { motion, AnimatePresence } from 'framer-motion';
import { addToAppleWallet, addToGoogleWallet, getWalletPlatform } from '../hooks/useWallet';
import ProfileMenu from '../components/ProfileMenu';
import ClientMealPlan from '../components/ClientMealPlan';
import NutritionToday from '../components/NutritionToday';

function Nutricion() {
  const navigate = useNavigate();
  const { user, recipes, classesRemaining, avatarUrl } = useAuth();
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeData, setRecipeData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [favorites, setFavorites] = useState([]);
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
  const isScrolled = useScrollDetect(30);

  // Bloquear el scroll del fondo cuando hay un drawer/sheet abierto (evita que
  // el gesto de scroll se "robe" hacia el fondo en iOS y rompa el scroll interno)
  useEffect(() => {
    const open = showRecipe || showQR;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showRecipe, showQR]);

  const handleMealClick = (meal) => {
    setRecipeData(meal);
    setShowRecipe(true);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Recetas globales
  const meals = recipes || [];

  return (
    <div className="mobile-app-container" style={{ background: 'var(--app-bg)' }}>
      {/* HEADER UNIFICADO */}
      <header className="ios-header" style={{ paddingBottom: '5px', background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: '0 0 2px', fontWeight: 600 }}>Plan Nutricional</p>
            <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1, color: 'var(--black)' }}>Healthy Era</h1>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-sidebar">
          {/* Plan nutricional real + calendario mensual de comidas */}
          <ClientMealPlan userId={user?.id} />

          {/* HIDRATACIÓN - Minimal Circle Progress */}
          <NutritionToday userId={user?.id} />
        </div>

        <div className="dashboard-content" style={{ marginTop: '5px' }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
               <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--on-surface)', fontFamily: 'var(--font-display)' }}>Recetas saludables</h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,145,77,0.1)', padding: '6px 12px', borderRadius: '99px' }}>
                 <Utensils size={12} color="var(--primary)" />
                 <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>{meals.length}</span>
               </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {meals.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)', background: 'var(--app-surface-solid)', borderRadius: '20px', border: '1px solid var(--border-subtle, rgba(0,0,0,0.05))' }}>
                   <Utensils size={30} style={{ opacity: 0.3, marginBottom: '10px' }} />
                   <p style={{ margin: 0, fontWeight: 600 }}>Pronto habrá recetas aquí</p>
                 </div>
               ) : meals.map(meal => (
                 <MealItem
                   key={meal.id}
                   meal={meal}
                   isFavorite={favorites.includes(meal.id)}
                   onFavorite={(e) => toggleFavorite(meal.id, e)}
                   onClick={() => handleMealClick(meal)}
                 />
               ))}
            </div>
          </section>
        </div>
      </main>

      {/* RECIPE DRAWER */}
      <AnimatePresence>
        {showRecipe && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay" 
            onClick={() => setShowRecipe(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="modal-drawer" 
              onClick={(e) => e.stopPropagation()} 
              style={{ paddingBottom: '40px', background: 'var(--surface)', overflowY: 'auto', maxHeight: '92vh', WebkitOverflowScrolling: 'touch' }}
            >
              <div className="sheet-handle"></div>
              
              <div style={{ height: '240px', borderRadius: '28px', overflow: 'hidden', marginBottom: '24px', position: 'relative', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                <img src={recipeData?.img} alt="Recipe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', top: '20px', left: '20px',
                  background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
                  padding: '8px 16px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--black)'
                }}>
                  {recipeData?.time}
                </div>
                <button onClick={() => setShowRecipe(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '16px', right: '16px', width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                  <X size={18} color="#1A1C1E" />
                </button>
              </div>

              <div style={{ padding: '0 10px' }}>
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '12px', lineHeight: 1.1 }}>{recipeData?.title}</h2>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#8a7266' }}>
                     <Clock size={16} /> {recipeData?.timePrep}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#8a7266' }}>
                     <Flame size={16} /> {recipeData?.kcal} kcal
                   </div>
                </div>

                <div style={{ background: 'var(--app-surface-solid)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--card-shadow)', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--on-surface)' }}>Ingredientes</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    {recipeData?.ingredients.map((ing, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--surface-low)', borderRadius: '14px', fontSize: '0.9rem', color: 'var(--on-surface)', fontWeight: 500 }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px', color: 'var(--black)' }}>Preparación</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recipeData?.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ 
                          width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', 
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '0.85rem', fontWeight: 900, flexShrink: 0, marginTop: '2px' 
                        }}>
                          {i+1}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#564338', lineHeight: 1.6, fontWeight: 500 }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => setShowRecipe(false)} style={{ 
                  width: '100%', padding: '18px', borderRadius: '99px', border: 'none',
                  background: 'var(--black)', color: 'white', fontSize: '1rem', fontWeight: 800,
                  boxShadow: '0 15px 35px rgba(0,0,0,0.15)', cursor: 'pointer'
                }}>
                  Listo, volver al menú
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISCLAIMER NUTRICIONAL */}
      <div style={{ padding: '0 16px 140px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div style={{
          background: 'rgba(255,139,66,0.06)', borderRadius: '20px', padding: '16px 18px',
          border: '1px solid rgba(255,139,66,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
            <Info size={16} color="#FF8B42" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--on-surface-variant)', fontWeight: 600, lineHeight: 1.5 }}>
              La información nutricional mostrada es de referencia general y no sustituye el consejo de un profesional de la salud. Consulta a un nutriólogo para recomendaciones personalizadas.
            </p>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fuentes de referencia:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'WHO — Healthy Diet (Fact Sheet)', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' },
              { label: 'Harvard T.H. Chan — The Nutrition Source', url: 'https://nutritionsource.hsph.harvard.edu/' },
              { label: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
            ].map(({ label, url }) => (
              <button
                key={url}
                onClick={() => window.open(url, '_system')}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', lineHeight: 1.4 }}
              >
                · {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QR BOTTOM SHEET */}
      <AnimatePresence>
        {showQR && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="qr-sheet-overlay" onClick={() => setShowQR(false)} />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setShowQR(false);
                }
              }}
              className="qr-bottom-sheet"
              style={{ padding: '12px 24px 20px', background: 'var(--surface)', position: 'relative' }}
            >
              <div className="sheet-handle" />
              <button onClick={() => setShowQR(false)} aria-label="Cerrar" style={{ position: 'absolute', top: '14px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                <X size={17} color="var(--on-surface)" />
              </button>
              
              <div className="wallet-card" style={{ 
                background: 'var(--surface-low)', 
                boxShadow: 'var(--card-shadow)',
                border: '1px solid var(--border-subtle)',
                position: 'relative', overflow: 'hidden',
                margin: '0 auto 10px',
                width: '100%',
                borderRadius: '30px'
              }}>
                <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'skewX(-20deg)' }}></div>

                <div className="wallet-header" style={{ borderBottom: 'none', paddingBottom: 0, paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(255,139,66,0.3)', flexShrink: 0 }}><img src="/logo2.png" alt="Be Fit Lab" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--black)', letterSpacing: '2px' }}>BE FIT LAB</span>
                  </div>
                  <QrCode size={20} color="var(--primary)" opacity={0.8} />
                </div>
                
                <div className="wallet-body" style={{ padding: '25px 20px', textAlign: 'center' }}>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '20px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: 'none' }}>
                    <QRCodeCanvas 
                      value={user?.id || 'befit-client-id'} 
                      size={160}
                      level={"H"}
                      includeMargin={false}
                      fgColor="#000000"
                    />
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
                <div className="user-name">{user?.user_metadata?.full_name || 'Miembro Be Fit'}</div>
                <div>{user?.email}</div>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NAV */}
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
        <Link to="/evolucion" className="nav-item"><TrendingUp size={22} strokeWidth={2.5} /><span>Metas</span></Link>
        <button className="nav-qr-button" onClick={() => setShowQR(true)}><QrCode size={24} strokeWidth={2.5} /></button>
        <Link to="/nutricion" className="nav-item active"><Utensils size={22} strokeWidth={2.5} /><span>Comida</span></Link>
        <Link to="/agenda" className="nav-item"><Calendar size={22} strokeWidth={2.5} /><span>Clases</span></Link>
      </nav>
    </div>
  );
}

function MealItem({ meal, isFavorite, onFavorite, onClick }) {
  const { time, title, kcal, img, timePrep } = meal;
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ 
        padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', 
        background: 'var(--app-surface-solid)', borderRadius: '24px', boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--border-subtle)', position: 'relative'
      }}
    >
      <div style={{ width: '90px', height: '90px', borderRadius: '20px', overflow: 'hidden', flexShrink: 0 }}>
        <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{time}</div>
          <button 
            onClick={onFavorite}
            style={{ border: 'none', background: 'transparent', padding: '0', cursor: 'pointer', color: isFavorite ? '#FF4D4D' : '#ddc1b3' }}
          >
            <Heart size={18} fill={isFavorite ? '#FF4D4D' : 'transparent'} />
          </button>
        </div>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--black)', marginBottom: '8px', fontFamily: 'var(--font-display)', lineHeight: 1.2, fontWeight: 800 }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#8a7266', fontWeight: 700 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} color="var(--primary)" /> {kcal} kcal
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> {timePrep}
           </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Nutricion;
