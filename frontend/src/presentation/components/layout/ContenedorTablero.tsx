import React, { useState, useEffect } from 'react';
import { Cargador } from '../common/Cargador';

interface PropiedadesContenedorTablero {
  titulo: string;
  iframeSrc: string;
  iframeTitle: string;
  textoCargando: string;
  colorFondoCargador?: string;
  altura?: string;
  esContenedorCompleto?: boolean;
}

export const ContenedorTablero: React.FC<PropiedadesContenedorTablero> = ({
  titulo,
  iframeSrc,
  iframeTitle,
  textoCargando,
  colorFondoCargador = '#ffffff',
  altura = '100%',
  esContenedorCompleto = false
}) => {
  const [estaCargando, establecerEstaCargando] = useState(true);

  useEffect(() => {
    const alRecibirMensaje = (evento: MessageEvent) => {
      // Verificar si el mensaje proviene de nuestro tablero Dash
      if (evento.data && evento.data.type === 'DASH_LOADED') {
        establecerEstaCargando(false);
      }
    };

    window.addEventListener('message', alRecibirMensaje);
    return () => {
      window.removeEventListener('message', alRecibirMensaje);
    };
  }, []);

  const estiloContenedorPagina: React.CSSProperties = esContenedorCompleto
    ? {
        padding: '8px 24px 24px 24px',
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        backgroundColor: '#f8fafc'
      }
    : {
        padding: '8px 0px 24px 0px',
        boxSizing: 'border-box',
        backgroundColor: '#f8fafc'
      };

  const estiloAreaIframe: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: altura,
    backgroundColor: esContenedorCompleto ? '#ffffff' : 'transparent',
    borderRadius: esContenedorCompleto ? '12px' : '0px',
    border: esContenedorCompleto ? '1px solid #e5e7eb' : 'none',
    boxShadow: esContenedorCompleto ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)' : 'none',
    overflow: 'hidden',
    flex: esContenedorCompleto ? 1 : 'none'
  };

  return (
    <div style={estiloContenedorPagina}>
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
          {titulo}
        </h1>
      </div>

      <div style={estiloAreaIframe}>
        {estaCargando && (
          <Cargador 
            texto={textoCargando} 
            colorFondo={colorFondoCargador} 
          />
        )}
        <iframe
          src={iframeSrc}
          title={iframeTitle}
          width="100%"
          height={altura}
          scrolling={esContenedorCompleto ? 'yes' : 'no'}
          style={{
            border: 'none',
            display: estaCargando ? 'none' : 'block',
            overflow: esContenedorCompleto ? 'auto' : 'hidden'
          }}
        />
      </div>
    </div>
  );
};
