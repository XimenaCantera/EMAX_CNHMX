import React, { useState, useEffect } from 'react';
import { Cargador } from '../common/cargador';
import { SinDatos } from '../common/SinDatos';
import { API_BASE_URL } from '../../../config';

interface PropiedadesContenedorTablero {
  titulo: string;
  descripcion?: string;
  iframeSrc: string;
  iframeTitle: string;
  textoCargando: string;
  colorFondoCargador?: string;
  altura?: string;
  esContenedorCompleto?: boolean;
}

export const ContenedorTablero: React.FC<PropiedadesContenedorTablero> = ({
  titulo,
  descripcion,
  iframeSrc,
  iframeTitle,
  textoCargando,
  colorFondoCargador = '#ffffff',
  altura = '100%',
  esContenedorCompleto = false
}) => {
  const [estaCargando, establecerEstaCargando] = useState(true);
  const [dataExists, setDataExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard`);
        const json = await res.json();
        if (json.no_data) {
          setDataExists(false);
        } else {
          setDataExists(true);
        }
      } catch (err) {
        setDataExists(true);
      }
    };
    checkData();

    const alRecibirMensaje = (evento: MessageEvent) => {
      // Ver si el mensaje viene del tablero Dash
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
      padding: '0px 24px 24px 24px',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc',
      overflow: 'hidden'
    }
    : {
      padding: '8px 0px 24px 0px',
      boxSizing: 'border-box',
      backgroundColor: '#f8fafc'
    };

  const estiloAreaIframe: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: esContenedorCompleto ? '100%' : altura,
    backgroundColor: esContenedorCompleto ? '#ffffff' : 'transparent',
    borderRadius: esContenedorCompleto ? '12px' : '0px',
    border: esContenedorCompleto ? '1px solid #e5e7eb' : 'none',
    boxShadow: esContenedorCompleto ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)' : 'none',
    overflow: 'hidden',
    flex: esContenedorCompleto ? 1 : 'none'
  };

  if (dataExists === false) {
    return <SinDatos />;
  }

  if (dataExists === null) {
    return (
      <div style={estiloContenedorPagina}>
        <Cargador
          texto={textoCargando}
          colorFondo={colorFondoCargador}
        />
      </div>
    );
  }

  return (
    <div style={estiloContenedorPagina}>
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
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
        {descripcion && (
          <p className="text-muted" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '6px', marginBottom: 0 }}>
            {descripcion}
          </p>
        )}
      </div>

      <div style={estiloAreaIframe}>
        {estaCargando && (
          <Cargador
            texto={textoCargando}
            colorFondo={colorFondoCargador}
          />
        )}
        <iframe
          src={iframeSrc.startsWith('http') ? iframeSrc : `${API_BASE_URL}${iframeSrc}`}
          title={iframeTitle}
          width="100%"
          height="100%"
          scrolling={esContenedorCompleto ? 'yes' : 'no'}
          style={{
            border: 'none',
            display: estaCargando ? 'none' : 'block',
            overflow: esContenedorCompleto ? 'auto' : 'hidden',
            height: '100%',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
};
