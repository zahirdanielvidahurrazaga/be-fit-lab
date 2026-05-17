import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

function Terminos() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'white',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div onClick={() => navigate(-1)} style={{ 
          width: '38px', height: '38px', borderRadius: '50%', 
          background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <ChevronLeft size={20} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--primary)" />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Términos y Condiciones</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', lineHeight: 1.8, fontSize: '0.92rem', color: '#374151' }}>
        <p style={{ color: '#6B7280', fontSize: '0.8rem', marginBottom: '2rem' }}>Última actualización: Mayo 2026</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginBottom: '0.5rem' }}>1. Aceptación de los Términos</h2>
        <p>Al registrarte y utilizar la aplicación <strong>BEFIT LAB</strong>, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte, te pedimos que no utilices nuestros servicios.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>2. Descripción del Servicio</h2>
        <p>BEFIT LAB es una plataforma que permite a las miembros del estudio de fitness gestionar sus membresías, reservar clases presenciales, acceder a planes de nutrición y dar seguimiento a su progreso personal.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>3. Membresías</h2>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Las membresías son <strong>personales e intransferibles</strong>.</li>
          <li>Las clases no utilizadas no son acumulables al siguiente período de membresía.</li>
          <li>La activación de la membresía se realiza a través del personal del estudio.</li>
        </ul>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>4. Reservaciones y Cancelaciones</h2>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Las reservas deben cancelarse con al menos <strong>4 horas de anticipación</strong>.</li>
          <li>Cancelaciones tardías o inasistencia sin aviso se contarán como clase utilizada.</li>
          <li>Te pedimos llegar al menos 5 minutos antes de tu clase. Después de la hora de inicio, no se garantiza el acceso.</li>
        </ul>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>5. Código de Conducta</h2>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Se requiere ropa deportiva cómoda y calcetines antiderrapantes para clases de Pilates.</li>
          <li>Queda prohibido cualquier comportamiento que afecte la experiencia de las demás alumnas.</li>
          <li>BEFIT LAB se reserva el derecho de cancelar la membresía de cualquier persona que incumpla este código.</li>
        </ul>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>6. Propiedad Intelectual</h2>
        <p>Todo el contenido de la aplicación BEFIT LAB, incluyendo pero no limitado a: diseño, logotipos, textos, gráficos, imágenes, recetas, planes de entrenamiento y software, es propiedad exclusiva de BEFIT LAB y está protegido por las leyes de propiedad intelectual aplicables en México.</p>
        <p>Queda prohibida la reproducción, distribución, modificación o uso comercial del contenido sin autorización previa por escrito.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>7. Limitación de Responsabilidad</h2>
        <p>BEFIT LAB no se hace responsable por:</p>
        <ul style={{ paddingLeft: '1.5rem' }}>
          <li>Lesiones resultantes del mal uso de los equipos o incumplimiento de las instrucciones del coach.</li>
          <li>Pérdida o daño de objetos personales dentro de las instalaciones.</li>
          <li>Interrupciones del servicio por causas de fuerza mayor o mantenimiento técnico.</li>
        </ul>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>8. Política de Reembolsos</h2>
        <p>Las membresías adquiridas <strong>no son reembolsables</strong> una vez activadas, salvo en circunstancias extraordinarias evaluadas caso por caso por la administración del estudio.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>9. Modificaciones</h2>
        <p>BEFIT LAB se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios a través de la aplicación con anticipación razonable.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>10. Ley Aplicable y Jurisdicción</h2>
        <p>Estos términos se rigen por las leyes vigentes en los Estados Unidos Mexicanos. Cualquier controversia será sometida a la jurisdicción de los tribunales competentes de la ciudad de Puebla, Puebla, México.</p>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1A1C1E', marginTop: '2rem', marginBottom: '0.5rem' }}>11. Contacto</h2>
        <p>Para cualquier consulta sobre estos términos, escríbenos a: <strong>contacto@befitlab.com</strong></p>

        <div style={{ marginTop: '3rem', padding: '20px', background: 'rgba(255,145,77,0.06)', borderRadius: '16px', border: '1px solid rgba(255,145,77,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>BEFIT LAB © {new Date().getFullYear()} — Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default Terminos;
