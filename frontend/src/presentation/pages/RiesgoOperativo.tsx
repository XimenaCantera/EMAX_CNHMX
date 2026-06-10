import React from 'react';
import { ContenedorTablero } from '../components/layout/ContenedorTablero';

export const RiesgoOperativo: React.FC = () => {
  return (
    <ContenedorTablero
      titulo="Riesgo Operativo"
      iframeSrc="http://127.0.0.1:5000/dash/riesgo/"
      iframeTitle="Riesgo Operativo Dash"
      textoCargando="Cargando panel de riesgo operativo..."
      altura="100%"
      esContenedorCompleto={true}
    />
  );
};
