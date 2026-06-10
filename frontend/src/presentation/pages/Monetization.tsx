import React from 'react';
import { Filter, ChevronRight, AlertTriangle, Lightbulb } from 'lucide-react';
import './Monetization.css';

export const Monetization: React.FC = () => {
  return (
    <div className="monetization-page">
      <div className="page-header">
        <h1>Monetización</h1>
        <p className="text-muted">Unidades con mayor oportunidad comercial y de servicio</p>
      </div>

      <div className="metrics-grid">
        <div className="card kpi-card">
          <span className="kpi-title">UNIDADES MONETIZABLES</span>
          <div className="kpi-value-row">
            <span className="kpi-value">1,248</span>
            <span className="kpi-trend text-success">+12% vs last month</span>
          </div>
        </div>
        
        <div className="card kpi-card">
          <span className="kpi-title">VALOR ESTIMADO TOTAL</span>
          <div className="kpi-value-row">
            <span className="kpi-value">$4.2M</span>
            <span className="kpi-unit">USD</span>
          </div>
        </div>

        <div className="card kpi-card bg-critical-light">
          <span className="kpi-title text-critical">ALTO RIESGO / POTENCIAL</span>
          <div className="kpi-value-row">
            <span className="kpi-value text-critical">84</span>
            <span className="kpi-trend text-critical">Requieren atención inmediata</span>
          </div>
          <AlertTriangle className="kpi-bg-icon text-critical opacity-20" size={48} />
        </div>
      </div>

      <div className="filters-bar card">
        <div className="filters-header">
          <Filter size={18} className="text-muted" />
          <span className="font-medium text-sm">Filtros:</span>
        </div>
        <div className="filter-pills">
          <button className="filter-pill">Distribuidor (Todos)</button>
          <button className="filter-pill">Marca (Todas)</button>
          <button className="filter-pill">Modelo (Todos)</button>
          <button className="filter-pill">Riesgo (Todos)</button>
          <button className="filter-pill">Estatus (Todos)</button>
        </div>
      </div>

      <div className="content-grid">
        <div className="card table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>UNIDAD</th>
                <th>DISTRIBUIDOR</th>
                <th>ESTATUS</th>
                <th>RIESGO</th>
                <th>PRÓXIMO SERVICIO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="unit-info">
                    <div className="unit-icon-box">🚜</div>
                    <div>
                      <div className="font-bold">MAG-2023-X9</div>
                      <div className="text-xs text-muted">Case IH Magnum</div>
                    </div>
                  </div>
                </td>
                <td>AgroNorte S.A.</td>
                <td><span className="status-dot status-operating">Operando</span></td>
                <td><span className="risk-badge risk-high">Alto</span></td>
                <td>Hace 2 días<br/><span className="text-critical text-xs">(Vencido)</span></td>
              </tr>
              <tr>
                <td>
                  <div className="unit-info">
                    <div className="unit-icon-box">🚜</div>
                    <div>
                      <div className="font-bold">PUM-2022-L4</div>
                      <div className="text-xs text-muted">Case IH Puma</div>
                    </div>
                  </div>
                </td>
                <td>Tractores del Sur</td>
                <td><span className="status-dot status-maintenance">Mantenimiento</span></td>
                <td><span className="risk-badge risk-medium">Medio</span></td>
                <td>En 15 días</td>
              </tr>
              <tr>
                <td>
                  <div className="unit-info">
                    <div className="unit-icon-box">🚜</div>
                    <div>
                      <div className="font-bold">T7-2024-HD</div>
                      <div className="text-xs text-muted">New Holland T7</div>
                    </div>
                  </div>
                </td>
                <td>AgroNorte S.A.</td>
                <td><span className="status-dot status-stopped">Detenido</span></td>
                <td><span className="risk-badge risk-high">Alto</span></td>
                <td>Hace 5 días<br/><span className="text-critical text-xs">(Vencido)</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="side-panels">
          <div className="card side-panel-card">
            <div className="panel-header">
              <Activity size={18} className="text-primary" />
              <h3 className="font-bold">Nivel de Urgencia</h3>
            </div>
            
            <div className="urgency-bars">
              <div className="urgency-item">
                <div className="urgency-info">
                  <span className="text-sm">Crítico</span>
                  <span className="text-sm text-critical font-bold">12</span>
                </div>
                <div className="progress-bg"><div className="progress-fill bg-critical" style={{width: '5%'}}></div></div>
              </div>
              
              <div className="urgency-item">
                <div className="urgency-info">
                  <span className="text-sm">Alto</span>
                  <span className="text-sm text-critical font-bold">84</span>
                </div>
                <div className="progress-bg"><div className="progress-fill bg-critical" style={{width: '25%'}}></div></div>
              </div>

              <div className="urgency-item">
                <div className="urgency-info">
                  <span className="text-sm">Medio</span>
                  <span className="text-sm text-warning font-bold">342</span>
                </div>
                <div className="progress-bg"><div className="progress-fill bg-warning" style={{width: '60%'}}></div></div>
              </div>

              <div className="urgency-item">
                <div className="urgency-info">
                  <span className="text-sm">Bajo</span>
                  <span className="text-sm text-muted font-bold">810</span>
                </div>
                <div className="progress-bg"><div className="progress-fill bg-neutral" style={{width: '90%'}}></div></div>
              </div>
            </div>
          </div>

          <div className="card action-highlight-card">
            <div className="panel-header text-white">
              <Lightbulb size={18} />
              <h3 className="font-bold">SIGUIENTE ACCIÓN</h3>
            </div>
            <p className="action-text">
              "Contactar primero a <strong>AgroNorte S.A.</strong> por 28 unidades con alto potencial y servicio vencido."
            </p>
            <button className="btn btn-light w-full mt-lg">
              Iniciar Campaña <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity component replacement since it wasn't imported
const Activity = ({size, className}: {size: number, className?: string}) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
