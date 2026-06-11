import React from 'react';
import { ContenedorTablero } from '../components/layout/ContenedorTablero';

export const VistaMonetizacion: React.FC = () => {
  return (
    <ContenedorTablero
      titulo="Monetización"
      iframeSrc="http://127.0.0.1:5000/dash/monetizacion/"
      iframeTitle="Monetización Dash"
      textoCargando="Cargando panel de monetización..."
      colorFondoCargador="#f8fafc"
      altura="1150px"
      esContenedorCompleto={false}
    />
  );
};

export const Monetization = VistaMonetizacion;
