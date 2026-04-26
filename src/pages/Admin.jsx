import React from 'react';
import { Users, DollarSign, Calendar, TrendingUp, Search, Bell, Menu } from 'lucide-react';

function Admin() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: '1200px', background: '#F4F7F6', color: '#1A1C1E', fontFamily: 'var(--font-body)' }}>
      
      {/* Sidebar Administrativo (Desktop) */}
      <aside style={{ width: '280px', background: 'white', borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>
            BEFIT <span style={{ color: 'var(--primary)' }}>ADMIN</span>
          </div>
        </div>
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <AdminItem icon={<TrendingUp size={20}/>} label="Dashboard General" active />
          <AdminItem icon={<Users size={20}/>} label="Alumnas (CRM)" />
          <AdminItem icon={<Calendar size={20}/>} label="Gestión de Clases" />
          <AdminItem icon={<DollarSign size={20}/>} label="Finanzas y Pagos" />
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>D</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Dueña Lab</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Master Control</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace Principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{ height: '80px', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Resumen Ejecutivo</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ background: '#F3F4F6', padding: '0.6rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', width: '300px' }}>
              <Search size={18} /> Buscar clienta o pago...
            </div>
            <Bell size={22} color="#4B5563" />
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '3rem', overflowY: 'auto' }}>
          
          {/* Top Metrics Vitals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
            <MetricBox title="Ingresos Mensuales" value="$145,200" trend="+12% vs mes anterior" icon={<DollarSign color="var(--primary)"/>} />
            <MetricBox title="Alumnas Activas" value="184" trend="+5 nuevas esta semana" icon={<Users color="#3B82F6"/>} />
            <MetricBox title="Aforo Promedio" value="92%" trend="Clases casi llenas" icon={<TrendingUp color="#10B981"/>} />
            <MetricBox title="Renovaciones Pendientes" value="12" trend="Requieren atención hoy" icon={<Calendar color="#EF4444"/>} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Main Graph Area */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.1rem', color: '#111827' }}>Flujo de Reservas de la Semana</h3>
              {/* Fake Graph visualizer */}
              <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px dashed #E5E7EB' }}>
                {[60, 80, 100, 85, 95, 40, 20].map((h, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '10%' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: h === 100 ? 'var(--primary)' : '#E5E7EB', borderRadius: '6px 6px 0 0' }}></div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][i]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas y Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Estado de Clases Hoy</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ClassStatus time="07:00 AM" name="Reformer Avanzado" status="100% Lleno" />
                  <ClassStatus time="09:30 AM" name="Yoga Flow" status="2 Lugares" />
                  <ClassStatus time="06:00 PM" name="Glúteo 101" status="100% Lleno" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

function AdminItem({ icon, label, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem 1rem',
      borderRadius: '8px', cursor: 'pointer',
      background: active ? 'rgba(201, 114, 93, 0.1)' : 'transparent',
      color: active ? 'var(--primary)' : '#4B5563',
      fontWeight: active ? '600' : '500',
    }}>
      {icon} <span>{label}</span>
    </div>
  )
}

function MetricBox({ title, value, trend, icon }) {
  return (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: 500 }}>{title}</div>
        <div>{icon}</div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 500 }}>{trend}</div>
    </div>
  )
}

function ClassStatus({ time, name, status }) {
  const isFull = status.includes('100%');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
      <div>
        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>{name}</div>
        <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{time}</div>
      </div>
      <div style={{ background: isFull ? '#FEE2E2' : '#D1FAE5', color: isFull ? '#EF4444' : '#10B981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
        {status}
      </div>
    </div>
  )
}

export default Admin;
