import React, { useEffect, useState } from 'react';
import styles from './FugaServicios.module.css';
import { Wrench, Percent, Target, Clock } from 'lucide-react';

interface FugaData {
  kpis: {
    servicios_fuga: number;
    pct_pendiente_cerrada_fuera: number;
    meta_depuracion: string;
    retraso_promedio: number;
  };
  table: Array<{
    Unidad: string;
    Distribuidor: string;
    Estatus: string;
    'Horas de retraso': number;
    'Frecuencia de servicio': string;
    'Acción recomendada': string;
  }>;
}

export const FugaServicios: React.FC = () => {
  const [data, setData] = useState<FugaData | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8050/api/fuga-data')
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  if (!data) {
    return <div className={styles.loading}>Cargando datos del servidor Python...</div>;
  }

  const getEstatusClass = (estatus: string) => {
    if (estatus === 'Pendiente') return styles.estatusPendiente;
    if (estatus === 'Cerrada Fuera') return styles.estatusCerradaFuera;
    if (estatus === 'Por vencer') return styles.estatusPorVencer;
    if (estatus === 'Cerrada') return styles.estatusCerrada;
    return styles.estatusDefault;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Fuga de servicios</h1>

      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Wrench size={24} /></div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiTitle}>Servicios en fuga</p>
            <h2 className={styles.kpiValue}>{data.kpis.servicios_fuga.toLocaleString()}</h2>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Percent size={24} /></div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiTitle}>% Pendiente/Cerrada Fuera</p>
            <h2 className={styles.kpiValue}>{data.kpis.pct_pendiente_cerrada_fuera}%</h2>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Target size={24} /></div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiTitle}>Meta de depuración</p>
            <h2 className={styles.kpiValue}>{data.kpis.meta_depuracion}</h2>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Clock size={24} /></div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiTitle}>Retraso promedio en unidades frecuentes</p>
            <h2 className={styles.kpiValue}>{data.kpis.retraso_promedio} horas</h2>
          </div>
        </div>
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.tableSection}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Distribuidor</th>
                  <th>Estatus</th>
                  <th>Horas de retraso</th>
                  <th>Frecuencia de servicio</th>
                  <th>Acción recomendada</th>
                </tr>
              </thead>
              <tbody>
                {data.table.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.Unidad}</td>
                    <td>{row.Distribuidor}</td>
                    <td><span className={`${styles.badge} ${getEstatusClass(row.Estatus)}`}>{row.Estatus}</span></td>
                    <td>{row['Horas de retraso']}</td>
                    <td>{row['Frecuencia de servicio']}</td>
                    <td>{row['Acción recomendada']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <span>&lt;</span>
            <span className={styles.pageActive}>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>...</span>
            <span>31</span>
            <span>&gt;</span>
          </div>
        </div>

        <div className={styles.chartsSection}>
          <iframe 
            src="http://127.0.0.1:8050/dash/" 
            className={styles.dashIframe} 
            title="Dash Graphs" 
          />
        </div>
      </div>
    </div>
  );
};
