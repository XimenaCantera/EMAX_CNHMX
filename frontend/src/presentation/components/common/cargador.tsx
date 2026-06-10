import React from 'react';

interface PropiedadesCargador {
    texto?: string;
    colorFondo?: string;
}

export const Cargador: React.FC<PropiedadesCargador> = ({
    texto = 'Cargando...',
    colorFondo = '#ffffff'
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            paddingTop: '100px',
            alignItems: 'center',
            backgroundColor: colorFondo,
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
                {texto}
            </span>
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};