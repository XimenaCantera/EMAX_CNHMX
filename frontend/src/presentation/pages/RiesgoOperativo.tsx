import React, { useState } from 'react';

export const RiesgoOperativo: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ 
      padding: '24px', 
      height: 'calc(100vh - 80px)', 
      display: 'flex', 
      flexDirection: 'column', 
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc' 
    }}>
      <div style={{ 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: 800, 
          color: '#10123C', 
          fontFamily: 'Hanken Grotesk, sans-serif',
          margin: 0,
          letterSpacing: '-0.025em'
        }}>
          Riesgo Operativo
        </h1>
      </div>

      <div style={{ 
        flex: 1, 
        position: 'relative', 
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        {loading && (
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#ffffff',
            zIndex: 10
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #10123C',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }} />
            <span style={{ 
              fontFamily: 'Inter, sans-serif', 
              fontSize: '14px', 
              color: '#6b7280',
              fontWeight: 500
            }}>
              Cargando panel de riesgo operativo...
            </span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        <iframe
          src="http://127.0.0.1:5000/dash/riesgo/"
          title="Riesgo Operativo Dash"
          width="100%"
          height="100%"
          style={{ 
            border: 'none', 
            display: loading ? 'none' : 'block'
          }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};
