import React from 'react';
import { Activity, AlertTriangle, DollarSign, Calendar, AlertCircle, PenTool, TrendingUp } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Panel de Monetización CNH</h1>
        <p className="text-muted">Oportunidades prioritarias de servicio y aftermarket</p>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">OPORTUNIDADES ACTIVAS</span>
            <Activity size={18} className="text-muted" />
          </div>
          <div className="kpi-value">1,204</div>
        </div>

        <div className="card kpi-card kpi-critical">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES CRÍTICAS</span>
            <AlertTriangle size={18} className="text-critical" />
          </div>
          <div className="kpi-value text-critical">87</div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">VALOR POTENCIAL ESTIMADO</span>
            <DollarSign size={18} className="text-muted" />
          </div>
          <div className="kpi-value">$4.2M</div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">PRÓXIMOS SERVICIOS (30 DÍAS)</span>
            <Calendar size={18} className="text-muted" />
          </div>
          <div className="kpi-value">342</div>
        </div>
      </div>

      <div className="main-grid">
        <div className="card chart-card">
          <h3 className="card-title">URGENCIA DE PORTAFOLIO</h3>
          <div className="donut-chart-container">
            <div className="donut-chart">
              <div className="donut-inner">
                <span className="donut-value">Crítico</span>
                <span className="donut-label">Nivel de atención requerido</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card table-card">
          <div className="card-header-flex">
            <h3 className="card-title">TOP OPORTUNIDADES</h3>
            <button className="btn btn-outline text-xs">Ver todas</button>
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
              <tr>
                <td className="font-bold">TRAC-8921</td>
                <td>AgroNorte S.A.</td>
                <td><span className="badge badge-critical">Crítico</span></td>
                <td>Vencido</td>
                <td className="font-bold">$12,500</td>
              </tr>
              <tr>
                <td className="font-bold">HARV-443</td>
                <td>Equipos Centro</td>
                <td><span className="badge badge-critical">Crítico</span></td>
                <td>En 2 días</td>
                <td className="font-bold">$8,200</td>
              </tr>
              <tr>
                <td className="font-bold">TRAC-102</td>
                <td>AgroSur</td>
                <td><span className="badge badge-warning">Alto</span></td>
                <td>En 5 días</td>
                <td className="font-bold">$5,100</td>
              </tr>
              <tr>
                <td className="font-bold">EXCA-99</td>
                <td>ConstruMaq</td>
                <td><span className="badge badge-neutral">Medio</span></td>
                <td>En 12 días</td>
                <td className="font-bold">$3,400</td>
              </tr>
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
            <p className="text-sm text-muted mb-auto">15 unidades en AgroNorte S.A. han excedido su ventana de servicio preventivo.</p>
            <button className="btn btn-primary w-full mt-lg">Iniciar Campaña</button>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <PenTool size={20} className="text-primary" />
              <h4 className="font-bold">Aprobar Kits de Reparación</h4>
            </div>
            <p className="text-sm text-muted mb-auto">32 solicitudes de kits de reparación de motor están pendientes de aprobación en la región sur.</p>
            <button className="btn btn-neutral w-full mt-lg">Revisar Solicitudes</button>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <TrendingUp size={20} className="text-primary" />
              <h4 className="font-bold">Revisar Precios Aftermarket</h4>
            </div>
            <p className="text-sm text-muted mb-auto">Nueva data de mercado sugiere oportunidad de ajuste de precios en filtros hidráulicos.</p>
            <button className="btn btn-neutral w-full mt-lg">Analizar Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};
