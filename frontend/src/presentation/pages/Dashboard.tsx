import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Calendar,
  AlertCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  Download,
  X
} from 'lucide-react';
import './Dashboard.css';
import { SinDatos } from '../components/common/SinDatos';


interface TopOportunidad {
  unidad: string;
  distribuidor: string;
  estado: string;
  proximo_servicio: string;
  horas_actuales?: number;
  potencial: number;
  servicios_cnt: number;
}

interface DashboardData {
  oportunidades_activas: number;
  unidades_alta_carga: number;
  valor_potencial: number;
  proximos_servicios: number;
  top_oportunidades: TopOportunidad[];
  todas_oportunidades?: TopOportunidad[];
  donut_chart_data: {
    critico_pct: number;
    critico_cnt?: number;
    alto_pct: number;
    alto_cnt?: number;
    medio_pct: number;
    medio_cnt?: number;
    bajo_pct: number;
    bajo_cnt?: number;
  };
  recomendaciones?: {
    distribuidores_desc: string;
    pendientes_desc: string;
    aftermarket_desc: string;
    nota_ejecutiva?: string;
  };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarDatosDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/dashboard');
      const json = await response.json();

      if (response.ok && json.success) {
        setData(json.data);
      } else if (json.no_data) {
        setError('no_data');
      } else {
        setError(json.error || 'Ocurrió un error al cargar el dashboard.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  // Dar formato de moneda
  const formatMoney = (valor: number) => {
    return `$${valor.toLocaleString('es-MX')}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p>Cargando panel de inicio y analizando bases de datos...</p>
      </div>
    );
  }

  if (error || !data) {
    const isNoData = error === 'no_data' || (error && error.includes('No such file or directory'));
    if (isNoData) {
      return <SinDatos />;
    }
    return (
      <div className="dashboard-error card">
        <AlertTriangle size={48} className="text-secondary" />
        <h2>Error al cargar el Dashboard</h2>
        <p className="error-message">{error || 'No hay datos disponibles.'}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={cargarDatosDashboard}>
            <RefreshCw size={16} /> Reintentar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/import')}>
            Ir a Importar Datos
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="dashboard-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Panel de Monetización CNH</h1>
          <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.875rem', color: '#6b7280' }}>
            Este panel muestra una información general de la oportunidad de mercado que hay en refacciones y servicios, ayudando a priorizar a los distribuidores y unidades con mayor oportunidad técnica y económica.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">SERVICIOS EN OPORTUNIDAD</span>
            <Activity size={18} className="text-muted" />
          </div>

          <div className="kpi-value">
            {(data.oportunidades_activas || 0).toLocaleString('es-MX')}
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES CON ALTA CARGA DE OPORTUNIDAD</span>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="kpi-value text-warning">
            {(data.unidades_alta_carga || 0).toLocaleString('es-MX')}
          </div>
        </div>


        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">PRÓXIMOS SERVICIOS (30 DÍAS)</span>
            <Calendar size={18} className="text-muted" />
          </div>
          <div className="kpi-value">
            {(data.proximos_servicios || 0).toLocaleString('es-MX')}
          </div>
        </div>
      </div>

      <div className="main-grid">
        <div className="card chart-card">
          <h3 className="card-title">URGENCIA DE SERVICIOS</h3>

          <div style={{ height: '280px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}>
            <iframe
              src="http://localhost:5000/dash/dashboard/donut/"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Urgencia de Servicios"
            />
          </div>

          <div className="donut-download-btn-wrapper">
            <a
              href="http://127.0.0.1:5000/api/download/tabla-riesgo"
              download="tabla_riesgo_unidades.xlsx"
              className="btn btn-outline donut-download-btn"
            >
              <Download size={15} />
              Mostrar información detallada
            </a>
          </div>

        </div>

        <div className="card table-card">
          <div className="card-header-flex">
            <h3 className="card-title">TOP SERVICIOS CON MAYOR OPORTUNIDAD (300 - 600 Horas)</h3>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-outline text-xs">
              Ver panel detallado
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ALIAS / SERIE</th>
                <th>DISTRIBUIDOR</th>
                <th>ESTATUS</th>
                <th>PRÓXIMO SERVICIO</th>
                <th>HORAS ACTUALES</th>
                <th>CANT. SERVICIOS</th>
                <th>POTENCIAL</th>
              </tr>
            </thead>

            <tbody>
              {(data.top_oportunidades || []).map((op, idx) => (
                <tr key={idx}>
                  <td className="font-bold">{op.unidad}</td>
                  <td>{op.distribuidor}</td>
                  <td>
                    <span
                      className={`badge ${op.estado === 'Crítico'
                        ? 'badge-critical'
                        : op.estado === 'Alto'
                          ? 'badge-warning'
                          : 'badge-neutral'
                        }`}
                    >
                      {op.estado}
                    </span>
                  </td>
                  <td>{op.proximo_servicio}</td>
                  <td>{op.horas_actuales ? `${op.horas_actuales} hrs` : '-'}</td>
                  <td>{op.servicios_cnt} servicios</td>
                  <td className="font-bold">{formatMoney(op.potencial || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div className="actions-section">
        <h3 className="section-title">ACCIONES RECOMENDADAS</h3>

        <div className="actions-grid">
          <div className="card action-card">
            <div className="action-header">
              <AlertCircle size={20} className="text-critical" />
              <h4 className="font-bold">Contactar Distribuidores Clave</h4>
            </div>
            <p className="text-sm text-muted mb-auto">
              {data.recomendaciones?.distribuidores_desc || ''}
            </p>
            <a href="/distributors" className="btn btn-primary w-full mt-lg text-center">
              Iniciar campaña
            </a>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <Activity size={20} className="text-primary" />
              <h4 className="font-bold">Revisar Servicios Pendientes</h4>
            </div>

            <p className="text-sm text-muted mb-auto">
              {data.recomendaciones?.pendientes_desc || ''}
            </p>


            <a href="/distributors" className="btn btn-neutral w-full mt-lg text-center">
              Revisar solicitudes
            </a>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <TrendingUp size={20} className="text-primary" />
              <h4 className="font-bold">Revisar Precios Aftermarket</h4>
            </div>
            <p className="text-sm text-muted mb-auto">
              {data.recomendaciones?.aftermarket_desc || ''}
            </p>
            <a href="/monetization" className="btn btn-neutral w-full mt-lg text-center">
              Analizar datos
            </a>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="font-bold text-lg">Panel Detallado</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ALIAS / SERIE</th>
                    <th>DISTRIBUIDOR</th>
                    <th>ESTATUS</th>
                    <th>PRÓXIMO SERVICIO</th>
                    <th>HORAS ACTUALES</th>
                    <th>CANT. SERVICIOS</th>
                    <th>POTENCIAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.todas_oportunidades || []).map((op, idx) => (
                    <tr key={idx}>
                      <td className="font-bold">{op.unidad}</td>
                      <td>{op.distribuidor}</td>
                      <td>
                        <span
                          className={`badge ${op.estado === 'Crítico'
                            ? 'badge-critical'
                            : op.estado === 'Alto'
                              ? 'badge-warning'
                              : 'badge-neutral'
                            }`}
                        >
                          {op.estado}
                        </span>
                      </td>
                      <td>{op.proximo_servicio}</td>
                      <td>{op.horas_actuales ? `${op.horas_actuales} hrs` : '-'}</td>
                      <td>{op.servicios_cnt} servicios</td>
                      <td className="font-bold">{formatMoney(op.potencial || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};