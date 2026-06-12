import React from 'react';
import { ContenedorTablero } from '../components/layout/ContenedorTablero';

export const VistaMonetizacion: React.FC = () => {
  return (
    <ContenedorTablero
      titulo="Monetización"
      descripcion="Este panel ayuda a estimar los ingresos de postventa viables y planificar estrategias comerciales con el objetivo de aumentar la rentabilidad de la red de distribuidores."
      iframeSrc="http://127.0.0.1:5000/dash/monetizacion/"
      iframeTitle="Monetización Dash"
      textoCargando="Cargando panel de monetización..."
      colorFondoCargador="#f8fafc"
      altura="1338px"
      esContenedorCompleto={false}
    />
  );
};

export const Monetization = VistaMonetizacion;
