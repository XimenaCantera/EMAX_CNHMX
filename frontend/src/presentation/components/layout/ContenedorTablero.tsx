import React, { useState, useEffect, useRef } from 'react';
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
  colorFondoCargador = '#f8fafc',
  altura = '100%',
  esContenedorCompleto = false
}) => {
  const [estaCargando, establecerEstaCargando] = useState(true);
  const [alturaIframe, setAlturaIframe] = useState('1600px');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const alRecibirMensaje = (evento: MessageEvent) => {
      if (evento.data && evento.data.type === 'DASH_LOADED') {
        establecerEstaCargando(false);
        setTimeout(() => {
          try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentDocument) {
              const h = iframe.contentDocument.body.scrollHeight;
              if (h > 0) setAlturaIframe(`${h + 40}px`);
            }
          } catch (e) { }
        }, 500);
      }
      if (evento.data && evento.data.type === 'DASH_HEIGHT') {
        const nuevaAltura = evento.data.height;
        if (nuevaAltura > 100) {
          setAlturaIframe(`${nuevaAltura + 20}px`);
        }
      }
    };

    window.addEventListener('message', alRecibirMensaje);
    return () => window.removeEventListener('message', alRecibirMensaje);
  }, []);

  const estiloContenedorPagina: React.CSSProperties = {
    padding: '8px 14px 0 14px',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc'
  };

  return (
    <div style={estiloContenedorPagina}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

      <div style={{ position: 'relative', width: '100%', minHeight: '200px' }}>
        {estaCargando && (
          <Cargador texto={textoCargando} colorFondo={colorFondoCargador} />
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title={iframeTitle}
          width="100%"
          height={alturaIframe}
          scrolling="no"
          style={{
            border: 'none',
            display: estaCargando ? 'none' : 'block',
            overflow: 'hidden'
          }}
        />
      </div>
    </div>
  );
};