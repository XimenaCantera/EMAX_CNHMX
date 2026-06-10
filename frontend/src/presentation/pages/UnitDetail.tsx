import React from 'react';
import { AlertCircle, ShoppingCart, Tractor } from 'lucide-react';
import './UnitDetail.css';

export const UnitDetail: React.FC = () => {
  return (
    <div className="unit-detail-page">
      <div className="page-header">
        <h1>Información de unidad</h1>
        <p className="text-muted">Consulta de estado, mantenimiento y oportunidad de monetización</p>
      </div>

      <div className="unit-grid">
        <div className="main-unit-content">
          <div className="card unit-header-card">
            <div className="unit-header-info">
              <div className="unit-icon-large">
                <Tractor size={32} />
              </div>
              <div className="unit-details">
                <h2>T-7 HD 315</h2>
                <div className="unit-meta">
                  <span className="badge badge-neutral text-xs">ID: MX-9021A</span>
                  <span className="text-sm font-medium">AgriSur Distribuidora</span>
                </div>
              </div>
            </div>
            
            <div className="unit-status-indicator">
              <span className="status-dot status-operating font-bold">Operativo</span>
              <span className="text-xs text-muted mt-1">Última sync: Hace 2 min</span>
            </div>
          </div>

          <div className="kpi-circles-grid">
            <div className="card circle-kpi-card">
              <div className="circle-chart chart-primary">
                <div className="circle-inner">
                  <span className="circle-value">4,250</span>
                  <span className="circle-label">Horas</span>
                </div>
              </div>
              <span className="circle-title">Horas Motor</span>
            </div>

            <div className="card circle-kpi-card">
              <div className="circle-chart chart-critical">
                <div className="circle-inner">
                  <span className="circle-value">15%</span>
                  <span className="circle-label">Vida útil</span>
                </div>
              </div>
              <span className="circle-title">Filtro Aceite</span>
            </div>

            <div className="card circle-kpi-card">
              <div className="circle-chart chart-primary" style={{background: 'conic-gradient(var(--color-primary) 0% 82%, var(--color-neutral) 82% 100%)'}}>
                <div className="circle-inner">
                  <span className="circle-value">82%</span>
                  <span className="circle-label">Eficiencia</span>
                </div>
              </div>
              <span className="circle-title">Rendimiento</span>
            </div>

            <div className="card circle-kpi-card card-warning-bg">
              <div className="warning-icon-large">
                <AlertCircle size={48} className="text-secondary" />
              </div>
              <div className="warning-text-container">
                <span className="text-secondary font-bold text-sm">Riesgo Moderado</span>
                <span className="text-xs">Mantenimiento próx.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="side-panels-unit">
          <div className="card alert-recommendation-card">
            <div className="alert-header">
              <AlertCircle size={18} className="text-secondary" />
              <h3 className="font-bold text-secondary text-sm">ALERTAS ACTIVAS + RECOMENDACIÓN</h3>
            </div>
            
            <p className="alert-description">
              El análisis predictivo indica degradación acelerada en el filtro de transmisión. Riesgo de inactividad en las próximas 50 horas de operación.
            </p>

            <div className="recommendation-box">
              <span className="font-bold text-sm">Kit Mantenimiento 5000h Preventivo</span>
              <div className="price-box">
                <span className="font-bold text-lg">$1,250 USD</span>
                <span className="text-muted text-sm" style={{textDecoration: 'line-through'}}>$1,400</span>
              </div>
            </div>

            <button className="btn btn-primary w-full mt-lg">
              <ShoppingCart size={18} /> Generar Orden de Compra
            </button>
          </div>

          <div className="card timeline-card">
            <h3 className="font-bold text-sm mb-lg">Historial de Mantenimiento</h3>
            
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-date">12 Oct 2023</span>
                  <span className="timeline-title">Cambio de Aceite Motor</span>
                  <span className="timeline-desc">Realizado por: AgriSur Distribuidora</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-date">05 Ago 2023</span>
                  <span className="timeline-title">Inspección Hidráulica 3000h</span>
                  <span className="timeline-desc">Sin anomalías reportadas.</span>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="timeline-date">15 Mar 2023</span>
                  <span className="timeline-title">Actualización de Software Telemétrico</span>
                  <span className="timeline-desc">OTA (Over-the-Air) exitoso.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
