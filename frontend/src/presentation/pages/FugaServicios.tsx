import React, { useState, useEffect } from 'react';
import styles from './FugaServicios.module.css';
import { Wrench, AlertTriangle, Target, Clock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { SinDatos } from '../components/common/SinDatos';
import { API_BASE_URL } from '../../config';

interface DistributorAnalysis {
  distribuidor: string;
  total_servicios: number;
  fugas: number;
  pct_fuga: number;
  z_score: number;
  significant_alert: boolean;
}

interface FugaData {
  kpis: {
    servicios_fuga: string;
    pct_pendiente_cerrada_fuera: number;
    ci_lower?: number;
    ci_upper?: number;
    meta_depuracion: string;
    retraso_promedio: number;
  };
  distribuidores_analisis?: DistributorAnalysis[];
  table: any[];
}

export const FugaServicios: React.FC = () => {
  const [data, setData] = useState<FugaData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEstatus, setSelectedEstatus] = useState<string>('Todos');
  const ROWS_PER_PAGE = 15;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/fuga-data`)
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  if (!data) {
    return <div className={styles.loading}>Cargando datos híbridos...</div>;
  }

  if ((data as any).no_data) {
    return <SinDatos />;
  }

  // Dibuja la etiqueta de estatus para colocar el filtro
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

  // Filtra los datos de la tabla según el estatus que se elija
  const filteredTableData = data.table.filter(row => {
    if (selectedEstatus === 'Todos') return true;
    return row['Estatus'] === selectedEstatus;
  });

  // PAGINACIÓN
  const totalPages = Math.ceil(filteredTableData.length / ROWS_PER_PAGE);
  const currentTableData = filteredTableData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  // Cambia la página actual en la tabla
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Dibuja los botones de numeración de páginas en la parte inferior de la tabla
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

  const estatusOptions = ['Todos', ...Array.from(new Set(data.table.map(row => row['Estatus'] as string).filter(Boolean)))];

  return (
    <div className={styles.container}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Fuga de servicios</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '6px' }}>
          Este panel analiza la pérdida de servicios preventivos no realizados en la red oficial midiendo el nivel de retrasos de servicio en unidades activas, dando información clave para coordinar la recuperación de clientes y mejorar la retención de postventa.
        </p>
      </div>
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
            <p className={styles.kpiTitle}>% Pendiente</p>
            <h2 className={styles.kpiValue}>{data.kpis.pct_pendiente_cerrada_fuera}%</h2>
            {data.kpis.ci_lower !== undefined && data.kpis.ci_upper !== undefined && (
              <p className={styles.kpiTooltip} title="Intervalo de confianza al 95%">
                (IC95%: {data.kpis.ci_lower}% - {data.kpis.ci_upper}%)
              </p>
            )}
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
          <h3 style={{ marginBottom: '1rem', color: '#111827', fontSize: '1.125rem' }}>Detalle de Unidades en Fuga</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Unidad</th>
                  <th>Distribuidor</th>
                  <th>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Estatus</span>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <ChevronDown size={14} style={{ color: '#4b5563', pointerEvents: 'none' }} />
                        <select
                          value={selectedEstatus}
                          onChange={(e) => {
                            setSelectedEstatus(e.target.value);
                            setCurrentPage(1);
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            border: 'none',
                            outline: 'none',
                            margin: 0,
                            padding: 0
                          }}
                        >
                          {estatusOptions.map(opt => (
                            <option key={opt} value={opt} style={{ color: '#374151' }}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </th>
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
              size={18}
              color={currentPage === 1 ? "#d1d5db" : "#111827"}
              style={{ cursor: currentPage === 1 ? 'default' : 'pointer' }}
              onClick={() => handlePageChange(currentPage - 1)}
            />
            {renderPaginationButtons()}
            <ChevronRight
              size={18}
              color={currentPage === totalPages ? "#d1d5db" : "#111827"}
              style={{ cursor: currentPage === totalPages ? 'default' : 'pointer' }}
              onClick={() => handlePageChange(currentPage + 1)}
            />
          </div>
        </div>

        <div className={styles.chartsSection}>
          <iframe
            src={`${API_BASE_URL}/dash/fuga/side/`}
            className={styles.dashIframe}
            title="Dash Graphs"
          ></iframe>
        </div>
      </div>

      <div className={styles.bottomChartSection}>
        <iframe
          src={`${API_BASE_URL}/dash/fuga/bottom/`}
          className={styles.dashIframeBottom}
          title="Distribution Graph"
        ></iframe>
      </div>
    </div>
  );
};
