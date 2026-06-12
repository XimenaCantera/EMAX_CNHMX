import React from 'react';
import { ContenedorTablero } from '../components/layout/ContenedorTablero';

export const RiesgoOperativo: React.FC = () => {
  return (
    <ContenedorTablero
      titulo="Riesgo Operativo"
      descripcion="Este panel ayuda a identificar a los distribuidores con equipos con mayores horas de retraso acumuladas, permitiendo programar visitas técnicas y campañas preventivas de manera oportuna."
      iframeSrc="/dash/riesgo/"
      iframeTitle="Riesgo Operativo Dash"
      textoCargando="Cargando panel de riesgo operativo..."
      colorFondoCargador="#f8fafc"
      altura="1600px"
      esContenedorCompleto={false}
    />
  );
};
