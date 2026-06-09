import React from 'react';
import { ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

export const RiesgoOperativo: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Riesgo Operativo</h1>
        <p className="text-muted">Análisis predictivo de fallas críticas y estado de salud de la flota</p>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card kpi-critical">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES EN RIESGO CRÍTICO</span>
            <ShieldAlert size={18} className="text-critical" />
          </div>
          <div className="kpi-value text-critical">14</div>
          <p className="text-xs text-muted mt-sm">Falla severa de motor o transmisión inminente</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ÍNDICE DE SALUD GENERAL</span>
            <Heart size={18} className="text-success" />
          </div>
          <div className="kpi-value text-success">92.4%</div>
          <p className="text-xs text-muted mt-sm">Porcentaje de flota operando óptimamente</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ALERTAS DE TELEMETRÍA (24H)</span>
            <Cpu size={18} className="text-muted" />
          </div>
          <div className="kpi-value">482</div>
          <p className="text-xs text-muted mt-sm">Códigos de falla leves detectados</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">SERVICIOS PREVENTIVOS AL DÍA</span>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div className="kpi-value">84%</div>
          <p className="text-xs text-muted mt-sm">Adherencia al programa preventivo</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card table-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="card-title">Matriz de Unidades Críticas Detectadas</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>CÓDIGO DE SERIE</th>
                <th>MODELO</th>
                <th>SISTEMA AFECTADO</th>
                <th>PROBABILIDAD DE FALLA</th>
                <th>TIEMPO ESTIMADO ANTES DE PARO</th>
                <th>SEVERIDAD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">MAG-X9-3221</td>
                <td>Case IH Magnum 340</td>
                <td>Sistema Hidráulico</td>
                <td className="font-bold text-critical">92%</td>
                <td>&lt; 10 horas de uso</td>
                <td><span className="badge badge-critical">Crítico</span></td>
              </tr>
              <tr>
                <td className="font-bold">T7-HD-9904</td>
                <td>New Holland T7.270</td>
                <td>Transmisión PowerShift</td>
                <td className="font-bold text-critical">88%</td>
                <td>&lt; 25 horas de uso</td>
                <td><span className="badge badge-critical">Crítico</span></td>
              </tr>
              <tr>
                <td className="font-bold">PUM-L4-1289</td>
                <td>Case IH Puma 185</td>
                <td>Inyección de Combustible</td>
                <td className="font-bold text-warning">74%</td>
                <td>&lt; 50 horas de uso</td>
                <td><span className="badge badge-warning">Alto</span></td>
              </tr>
              <tr>
                <td className="font-bold">TRAC-1248</td>
                <td>New Holland TS6.120</td>
                <td>Sistema de Enfriamiento</td>
                <td className="font-bold text-warning">65%</td>
                <td>&lt; 75 horas de uso</td>
                <td><span className="badge badge-warning">Alto</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
