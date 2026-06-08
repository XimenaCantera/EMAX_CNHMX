import React from 'react';
import { ChevronRight, Wrench, AlertTriangle, Clock } from 'lucide-react';
import './Distributors.css';

export const Distributors: React.FC = () => {
  return (
    <div className="distributors-page">
      <div className="page-header">
        <h1>Distribuidores</h1>
        <p className="text-muted">Resumen ejecutivo de carga, mantenimiento y oportunidad comercial</p>
      </div>

      <div className="metrics-grid dist-metrics">
        <div className="card kpi-card">
          <span className="kpi-title">Distribuidores Activos</span>
          <div className="kpi-value-row">
            <span className="kpi-value text-main">124</span>
            <span className="kpi-trend text-primary">+3 este mes</span>
          </div>
        </div>
        
        <div className="card kpi-card">
          <span className="kpi-title">Pendientes por Atender</span>
          <div className="kpi-value-row">
            <span className="kpi-value text-main">48</span>
            <span className="kpi-trend text-critical">Requiere acción</span>
          </div>
        </div>

        <div className="card kpi-card border-critical">
          <span className="kpi-title text-critical flex items-center gap-sm">
            <AlertTriangle size={14} /> Alertas Críticas
          </span>
          <div className="kpi-value-row">
            <span className="kpi-value text-critical">7</span>
            <span className="kpi-trend text-critical">Urgente</span>
          </div>
        </div>

        <div className="card kpi-card">
          <span className="kpi-title">Próximos Mantenimientos</span>
          <div className="kpi-value-row">
            <span className="kpi-value text-main">212</span>
            <span className="kpi-trend text-primary">Próximos 30 días</span>
          </div>
        </div>
      </div>

      <div className="main-content-grid">
        <div className="card top-distributors">
          <h3 className="card-title">Top 5 Distribuidores por Oportunidad</h3>
          
          <div className="distributor-bars">
            <div className="dist-item">
              <div className="dist-info">
                <span>Distribuidora Norte (Monterrey)</span>
                <span className="font-bold">$1.2M USD</span>
              </div>
              <div className="dist-bar-bg"><div className="dist-bar-fill bg-primary" style={{width: '90%'}}></div></div>
            </div>

            <div className="dist-item">
              <div className="dist-info">
                <span>Agromaq Centro (CDMX)</span>
                <span className="font-bold">$850k USD</span>
              </div>
              <div className="dist-bar-bg"><div className="dist-bar-fill bg-primary-light" style={{width: '70%'}}></div></div>
            </div>

            <div className="dist-item">
              <div className="dist-info">
                <span>Equipos Industriales (Guadalajara)</span>
                <span className="font-bold">$620k USD</span>
              </div>
              <div className="dist-bar-bg"><div className="dist-bar-fill bg-muted" style={{width: '50%'}}></div></div>
            </div>

            <div className="dist-item">
              <div className="dist-info">
                <span>Maquinaria del Pacífico (Sinaloa)</span>
                <span className="font-bold">$410k USD</span>
              </div>
              <div className="dist-bar-bg"><div className="dist-bar-fill bg-neutral-dark" style={{width: '35%'}}></div></div>
            </div>

            <div className="dist-item">
              <div className="dist-info">
                <span>Sur Tractores (Chiapas)</span>
                <span className="font-bold">$290k USD</span>
              </div>
              <div className="dist-bar-bg"><div className="dist-bar-fill bg-neutral-dark" style={{width: '20%'}}></div></div>
            </div>
          </div>
        </div>

        <div className="card priority-units">
          <div className="card-header-flex">
            <h3 className="card-title">Unidades Prioritarias</h3>
            <span className="text-xs font-bold cursor-pointer">Ver todo</span>
          </div>

          <div className="priority-list">
            <div className="priority-item">
              <div className="priority-icon bg-critical-light text-critical">
                <Wrench size={18} />
              </div>
              <div className="priority-content">
                <div className="font-bold text-sm">Dist. Norte - CH-902</div>
                <div className="text-xs text-critical">Fallo motor (48h)</div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>

            <div className="priority-item">
              <div className="priority-icon bg-critical-light text-critical">
                <AlertTriangle size={18} />
              </div>
              <div className="priority-content">
                <div className="font-bold text-sm">Agromaq - TX-105</div>
                <div className="text-xs text-critical">Alerta sistema hid. (24h)</div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>

            <div className="priority-item">
              <div className="priority-icon bg-neutral text-primary">
                <Clock size={18} />
              </div>
              <div className="priority-content">
                <div className="font-bold text-sm">Eq. Ind. - CX-500</div>
                <div className="text-xs text-primary">Mantenimiento preventivo</div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>

            <div className="priority-item">
              <div className="priority-icon bg-neutral text-primary">
                <Clock size={18} />
              </div>
              <div className="priority-content">
                <div className="font-bold text-sm">Sur Tract - MX-200</div>
                <div className="text-xs text-primary">Revisión 500 hrs</div>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>
        </div>
      </div>

      <div className="card chart-section">
        <div className="chart-header">
          <h3 className="card-title">Seguimiento de Pendientes vs Atendidos</h3>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot bg-primary"></span> Atendidos</span>
            <span className="legend-item"><span className="legend-dot bg-critical"></span> Pendientes</span>
          </div>
        </div>
        
        {/* Placeholder for the line chart */}
        <div className="chart-placeholder">
          <svg viewBox="0 0 800 200" className="mock-chart">
            <path d="M 50 180 Q 200 150 400 120 T 750 40" fill="none" stroke="var(--color-primary-light)" strokeWidth="4" />
            <path d="M 50 80 Q 200 100 400 110 T 750 160" fill="none" stroke="var(--color-secondary)" strokeWidth="4" strokeDasharray="10,10" />
            
            <text x="30" y="40" fontSize="10" fill="var(--color-text-muted)">100</text>
            <text x="30" y="90" fontSize="10" fill="var(--color-text-muted)">75</text>
            <text x="30" y="140" fontSize="10" fill="var(--color-text-muted)">50</text>
            <text x="30" y="190" fontSize="10" fill="var(--color-text-muted)">25</text>
            <text x="30" y="240" fontSize="10" fill="var(--color-text-muted)">0</text>
            
            <text x="100" y="220" fontSize="10" fill="var(--color-text-muted)">Lun</text>
            <text x="250" y="220" fontSize="10" fill="var(--color-text-muted)">Mar</text>
            <text x="400" y="220" fontSize="10" fill="var(--color-text-muted)">Mié</text>
            <text x="550" y="220" fontSize="10" fill="var(--color-text-muted)">Jue</text>
            <text x="700" y="220" fontSize="10" fill="var(--color-text-muted)">Vie</text>
          </svg>
        </div>
      </div>
    </div>
  );
};
