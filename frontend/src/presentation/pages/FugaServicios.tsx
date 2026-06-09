import React, { useState, useEffect } from 'react';
import styles from './FugaServicios.module.css';
import { Wrench, AlertTriangle, Target, Clock, ChevronLeft, ChevronRight, BarChart2, PieChart, BarChart } from 'lucide-react';

interface FugaData {
  kpis: {
    servicios_fuga: string;
    pct_pendiente_cerrada_fuera: number;
    meta_depuracion: string;
    retraso_promedio: number;
  };
  table: any[];
}

export const FugaServicios: React.FC = () => {
  const [data, setData] = useState<FugaData | null>(null);
  const [activeTab, setActiveTab] = useState<'histogram' | 'bar' | 'pie'>('histogram');

  useEffect(() => {
    fetch('http://127.0.0.1:8050/api/fuga-data')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  if (!data) {
    return <div className={styles.loading}>Cargando datos híbridos...</div>;
  }

  const renderEstatus = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return <span className={`${styles.badge} ${styles.estatusPendiente}`}>Pendiente</span>;
      case 'Cerrada Fuera':
        return <span className={`${styles.badge} ${styles.estatusCerradaFuera}`}>Cerrada Fuera</span>;
      case 'Por vencer':
        return <span className={`${styles.badge} ${styles.estatusPorVencer}`}>Por vencer</span>;
      case 'Cerrada':
        return <span className={`${styles.badge} ${styles.estatusCerrada}`}>Cerrada</span>;
      default:
        return <span className={`${styles.badge} ${styles.estatusDefault}`}>{estatus}</span>;
    }
  };

  const iframeUrl = `http://127.0.0.1:8050/dash/${activeTab}`;

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Fuga de servicios</h1>

      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><Wrench size={24} /></div>
          <div className={styles.kpiInfo}>
            <p className={styles.kpiTitle}>Servicios en fuga</p>
            <h2 className={styles.kpiValue}>{data.kpis.servicios_fuga}</h2>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><AlertTriangle size={24} /></div>
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
            <p className={styles.kpiTitle}>Retraso promedio (hrs)</p>
            <h2 className={styles.kpiValue}>{data.kpis.retraso_promedio}</h2>
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
                    <td>{row['Unidad']}</td>
                    <td>{row['Distribuidor']}</td>
                    <td>{renderEstatus(row['Estatus'])}</td>
                    <td>{row['Horas de retraso']}</td>
                    <td>{row['Frecuencia de servicio']}</td>
                    <td>{row['Acción recomendada']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <ChevronLeft size={20} color="#9ca3af" />
            <div className={styles.pageActive}>1</div>
            <div>2</div>
            <div>3</div>
            <div>...</div>
            <div>10</div>
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

      <div className={styles.chartsWrapper}>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'histogram' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('histogram')}
          >
            <BarChart2 size={18} />
            Distribución de retraso
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'bar' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('bar')}
          >
            <BarChart size={18} />
            Fuga por distribuidor
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'pie' ? styles.tabActive : ''}`} 
            onClick={() => setActiveTab('pie')}
          >
            <PieChart size={18} />
            Proporción de estatus
          </button>
        </div>
        
        <div className={styles.chartFrameContainer}>
          <iframe 
            src={iframeUrl} 
            className={styles.dashIframe}
            title="Dash Graphs"
          ></iframe>
        </div>
      </div>

    </div>
  );
};
