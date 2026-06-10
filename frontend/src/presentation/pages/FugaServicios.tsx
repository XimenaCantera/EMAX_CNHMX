import React from 'react';
import { Wrench, AlertTriangle, TrendingDown, Search } from 'lucide-react';
import './Dashboard.css';

export const FugaServicios: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Fuga de Servicios</h1>
        <p className="text-muted">Monitoreo de unidades que realizan servicios fuera del distribuidor autorizado</p>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card kpi-critical">
          <div className="kpi-header">
            <span className="kpi-title">TASA DE FUGA DE SERVICIO</span>
            <TrendingDown size={18} className="text-critical" />
          </div>
          <div className="kpi-value text-critical">24.8%</div>
          <p className="text-xs text-muted mt-sm">+1.2% respecto al mes anterior</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES EN RIESGO DE FUGA</span>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="kpi-value text-warning">148</div>
          <p className="text-xs text-muted mt-sm">Horas de servicio próximas o vencidas</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">PÉRDIDA POTENCIAL ESTIMADA</span>
            <span className="text-muted font-bold">$1.1M</span>
          </div>
          <div className="kpi-value">$1,124,500</div>
          <p className="text-xs text-muted mt-sm">Valor estimado de refacciones y mano de obra</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">DISTRIBUIDOR MÁS AFECTADO</span>
            <Wrench size={18} className="text-muted" />
          </div>
          <div className="kpi-value" style={{ fontSize: '1.5rem', lineHeight: '2rem' }}>AgroNorte S.A.</div>
          <p className="text-xs text-muted mt-sm">34 unidades con rezago de servicio</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card table-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header-flex">
            <h3 className="card-title">Alertas de Fuga de Servicio Activas</h3>
            <div className="search-bar" style={{ width: '250px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={14} className="text-muted" />
              <input type="text" placeholder="Filtrar alertas..." style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.825rem' }} />
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>UNIDAD</th>
                <th>DISTRIBUIDOR</th>
                <th>HORAS TOTALES</th>
                <th>ÚLTIMO REGISTRO</th>
                <th>STATUS FUGA</th>
                <th>ACCIÓN RECOMENDADA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">TRAC-9011</td>
                <td>AgroNorte S.A.</td>
                <td>1,420 hrs</td>
                <td>Hace 45 días</td>
                <td><span className="badge badge-critical">Fuga Confirmada</span></td>
                <td>
                  <button className="btn btn-outline text-xs" style={{ padding: '0.25rem 0.5rem' }}>Contactar Cliente</button>
                </td>
              </tr>
              <tr>
                <td className="font-bold">HARV-3104</td>
                <td>Equipos Centro</td>
                <td>615 hrs</td>
                <td>Hace 12 días</td>
                <td><span className="badge badge-warning">Riesgo Alto</span></td>
                <td>
                  <button className="btn btn-primary text-xs" style={{ padding: '0.25rem 0.5rem' }}>Agendar Preventivo</button>
                </td>
              </tr>
              <tr>
                <td className="font-bold">TRAC-5561</td>
                <td>AgroSur</td>
                <td>2,110 hrs</td>
                <td>Hace 30 días</td>
                <td><span className="badge badge-warning">Riesgo Alto</span></td>
                <td>
                  <button className="btn btn-primary text-xs" style={{ padding: '0.25rem 0.5rem' }}>Enviar Oferta Repuestos</button>
                </td>
              </tr>
              <tr>
                <td className="font-bold">EXCA-012</td>
                <td>ConstruMaq</td>
                <td>890 hrs</td>
                <td>Hace 60 días</td>
                <td><span className="badge badge-critical">Fuga Confirmada</span></td>
                <td>
                  <button className="btn btn-outline text-xs" style={{ padding: '0.25rem 0.5rem' }}>Llamar Distribuidor</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
