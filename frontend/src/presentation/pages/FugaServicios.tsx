import React, { useState, useEffect } from 'react';
import styles from './FugaServicios.module.css';
import { Wrench, AlertTriangle, Target, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 15;

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

  const totalPages = Math.ceil(data.table.length / ROWS_PER_PAGE);
  const currentTableData = data.table.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 4;
    
    for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
      buttons.push(
        <div 
          key={i} 
          className={currentPage === i ? styles.pageActive : styles.pageInactive}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </div>
      );
    }

    if (totalPages > maxVisiblePages) {
      if (totalPages > maxVisiblePages + 1) {
        buttons.push(<div key="dots" className={styles.pageInactive}>...</div>);
      }
      buttons.push(
        <div 
          key={totalPages} 
          className={currentPage === totalPages ? styles.pageActive : styles.pageInactive}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </div>
      );
    }

    return buttons;
  };

  return (
    <div className={styles.container}>
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
            <p className={styles.kpiTitle}>Retraso promedio en unidades frecuentes</p>
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
                {currentTableData.map((row, idx) => (
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
            <ChevronLeft 
              size={24} 
              color={currentPage === 1 ? "#d1d5db" : "#111827"} 
              style={{ cursor: currentPage === 1 ? 'default' : 'pointer' }} 
              onClick={() => handlePageChange(currentPage - 1)}
            />
            {renderPaginationButtons()}
            <ChevronRight 
              size={24} 
              color={currentPage === totalPages ? "#d1d5db" : "#111827"} 
              style={{ cursor: currentPage === totalPages ? 'default' : 'pointer' }} 
              onClick={() => handlePageChange(currentPage + 1)}
            />
          </div>
        </div>

        <div className={styles.chartsSection}>
          <iframe 
            src="http://127.0.0.1:8050/dash/" 
            className={styles.dashIframe}
            title="Dash Graphs"
          ></iframe>
        </div>
      </div>
    </div>
  );
};
