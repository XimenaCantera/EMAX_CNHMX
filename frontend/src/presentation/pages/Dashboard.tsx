import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';
import './Dashboard.css';
//Usamos lucide-react para poner íconos visuales en las tarjetas del dashboard.

interface TopOportunidad {
  unidad: string;
  distribuidor: string;
  estado: string;
  proximo_servicio: string;
  potencial: number;
}
interface TopOportunidad {
  unidad: string;
  distribuidor: string;
  estado: string;
  proximo_Servicio: string;
  potencial: number;
}

interface DashboardData {
  oportunidades_activas: number;
  unidades_criticas: number;
  valor_potencial: number;
  proximos_servicios: number;
  top_oportunidades: TopOportunidad[];
  donut_chart_data: {
    critico_pct: number;
    alto_pct: number;
    medio_pct: number;
    bajo_pct: number;
  };
  recomendaciones: {
    distribuidores_desc: string;
    pendientes_desc: string;
    aftermarket_desc: string;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatosDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/dashboard');
      const json = await response.json();

      if (response.ok && json.success) {
        setData(json.data);
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

  // Función para mostrar valores de dinero
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
    return (
      <div className="dashboard-error card">
        <AlertTriangle size={48} className="text-secondary" />
        <h2>Error al cargar el Dashboard</h2>
        <p className="error-message">{error || 'No hay datos disponibles.'}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={cargarDatosDashboard}>
            <RefreshCw size={16} /> Reintentar
          </button>
          <a href="/import" className="btn btn-outline">
            Ir a Importar Datos
          </a>
        </div>
      </div>
    );
  }

  // Cálculos para el gráfico de dona
  const datosDona = data.donut_chart_data;

  const critico = datosDona.critico_pct;
  const alto = critico + datosDona.alto_pct;
  const medio = alto + datosDona.medio_pct;

  const estiloDona = {
    background: `conic-gradient(
    #A32428 0% ${critico}%,
    #B45309 ${critico}% ${alto}%,
    #20235C ${alto}% ${medio}%,
    #E5E7EB ${medio}% 100%
  )`
  };

  return (
    <div className="dashboard-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Panel de Monetización CNH</h1>
          <p className="text-muted">Servicios con mayor oportunidad técnico y económica</p>
        </div>

        <button
          className="btn btn-outline text-xs flex items-center gap-xs"
          onClick={cargarDatosDashboard}
          title="Actualizar datos"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
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
        <div className="card kpi-card kpi-critical">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES CRÍTICAS</span>
            <AlertTriangle size={18} className="text-critical" />
          </div>
          <div className="kpi-value text-critical">
            {(data.unidades_criticas || 0).toLocaleString('es-MX')}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">VALOR POTENCIAL ESTIMADO</span>
            <DollarSign size={18} className="text-muted" />
          </div>
          <div className="kpi-value">
            {formatMoney(data.valor_potencial || 0)}
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

          <div className="donut-chart-container-flex">
            <div className="donut-chart" style={estiloDona}>
              <div className="donut-inner">
                <span className="donut-value">{datosDona.critico_pct}%</span>
                <span className="donut-label">Crítico</span>
              </div>
            </div>

            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#A32428' }}></span>
                <span className="legend-label">Crítico ({datosDona.critico_pct}%)</span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#B45309' }}></span>
                <span className="legend-label">Alto ({datosDona.alto_pct}%)</span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#20235C' }}></span>
                <span className="legend-label">Medio ({datosDona.medio_pct}%)</span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#E5E7EB' }}></span>
                <span className="legend-label">Bajo ({datosDona.bajo_pct}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card table-card">
          <div className="card-header-flex">
            <h3 className="card-title">TOP SERVICIOS CON MAYOR OPORTUNIDAD</h3>
            <a href="/monetization" className="btn btn-outline text-xs">
              Ver panel detallado
            </a>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>UNIDAD</th>
                <th>DISTRIBUIDOR</th>
                <th>ESTATUS</th>
                <th>PRÓXIMO SERVICIO</th>
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

            <button className="btn btn-neutral w-full mt-lg">
              Revisar solicitudes
            </button>
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
    </div>
  );
};