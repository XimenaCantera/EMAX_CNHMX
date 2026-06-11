import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SinDatosProps {
  titulo?: string;
  descripcion?: string;
  mostrarBoton?: boolean;
}

export const SinDatos: React.FC<SinDatosProps> = ({
  titulo = 'Faltan archivos de datos',
  descripcion = "Por favor, ve a la sección de 'Importar datos' y sube el archivo limpio de mantenimientos.",
  mostrarBoton = true
}) => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      minHeight: '60vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{
        padding: '40px 30px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.05)',
        maxWidth: '550px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{
          color: '#ef4444',
          marginBottom: '14px',
          fontWeight: 600,
          fontSize: '1.25rem',
          marginTop: 0
        }}>
          {titulo}
        </h3>
        <p style={{
          color: '#475569',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: mostrarBoton ? '24px' : 0,
          marginTop: 0
        }}>
          {descripcion}
        </p>
        {mostrarBoton && (
          <button 
            onClick={() => navigate('/import')}
            style={{
              backgroundColor: '#10123C',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              fontFamily: 'Outfit, sans-serif'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e226b'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10123C'}
          >
            Ir a Importar Datos
          </button>
        )}
      </div>
    </div>
  );
};
