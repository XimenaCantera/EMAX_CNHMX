import React from 'react';
import { CalendarRange, ClipboardList, TrendingUp, Users } from 'lucide-react';
import './Dashboard.css';

export const PlanMeses: React.FC = () => {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Plan a Meses</h1>
        <p className="text-muted">Planificación y calendarización de servicios predictivos y campañas de mantenimiento</p>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">TOTAL SERVICIOS PLANEADOS (3M)</span>
            <CalendarRange size={18} className="text-muted" />
          </div>
          <div className="kpi-value">1,024</div>
          <p className="text-xs text-muted mt-sm">Junio - Agosto 2026</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">INGRESOS PROYECTADOS (3M)</span>
            <TrendingUp size={18} className="text-success" />
          </div>
          <div className="kpi-value text-success">$3.8M</div>
          <p className="text-xs text-muted mt-sm">Basado en cotización promedio de refacciones</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">ADHERENCIA PLANEADA</span>
            <ClipboardList size={18} className="text-muted" />
          </div>
          <div className="kpi-value">91.2%</div>
          <p className="text-xs text-muted mt-sm">Porcentaje de éxito histórico de agenda</p>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">DISTRIBUIDORES ACTIVOS</span>
            <Users size={18} className="text-muted" />
          </div>
          <div className="kpi-value">18</div>
          <p className="text-xs text-muted mt-sm">Participando en la campaña de servicio</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="card table-card" style={{ gridColumn: 'span 2' }}>
          <h3 className="card-title">Distribución Mensual de Mantenimientos Preventivos</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>MES</th>
                <th>SERVICIOS PROGRAMADOS</th>
                <th>TRACTORES</th>
                <th>COSECHADORAS</th>
                <th>VALOR COMERCIAL</th>
                <th>ESTATUS DE AGENDA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Junio 2026</td>
                <td>342</td>
                <td>220 unidades</td>
                <td>122 unidades</td>
                <td className="font-bold">$1,210,000</td>
                <td><span className="badge badge-success">En Curso (85% agendado)</span></td>
              </tr>
              <tr>
                <td className="font-bold">Julio 2026</td>
                <td>418</td>
                <td>290 unidades</td>
                <td>128 unidades</td>
                <td className="font-bold">$1,540,000</td>
                <td><span className="badge badge-warning">Planeado (60% agendado)</span></td>
              </tr>
              <tr>
                <td className="font-bold">Agosto 2026</td>
                <td>264</td>
                <td>180 unidades</td>
                <td>84 unidades</td>
                <td className="font-bold">$1,070,000</td>
                <td><span className="badge badge-neutral">Abierto (15% agendado)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
