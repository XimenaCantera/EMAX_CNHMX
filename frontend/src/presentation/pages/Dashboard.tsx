import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, DollarSign, Calendar, AlertCircle, PenTool, TrendingUp, X, CheckCircle, Send, Search } from 'lucide-react';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [requests, setRequests] = useState([
    { id: 'REQ-001', dist: 'SurTractores', kit: 'Kit Motor X', status: 'Pendiente' },
    { id: 'REQ-002', dist: 'AgroSur', kit: 'Kit Transmisión', status: 'Pendiente' },
    { id: 'REQ-003', dist: 'Equipos Centro', kit: 'Filtros Hidráulicos', status: 'Pendiente' }
  ]);

  useEffect(() => {
    fetch('http://127.0.0.1:8050/api/dashboard-data')
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
        if (data?.actions?.kits?.requests) {
          setRequests(data.actions.kits.requests);
        }
      })
      .catch(err => console.error("Error loading dashboard data", err));
  }, []);

  const handleApprove = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Aprobado' } : r));
  };

  const handleReject = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rechazado' } : r));
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => {
      setEmailSent(false);
      setActiveModal(null);
    }, 2000);
  };

  const topDist = dashboardData?.actions?.campaign?.distributor || 'AgroNorte S.A.';
  const topUnits = dashboardData?.actions?.campaign?.units || 15;

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
            <p className="text-sm text-muted mb-auto">{topUnits.toLocaleString()} unidades en {topDist} han excedido su ventana de servicio preventivo.</p>
            <button className="btn btn-primary w-full mt-lg" onClick={() => setActiveModal('campaign')}>Iniciar Campaña</button>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <PenTool size={20} className="text-primary" />
              <h4 className="font-bold">Aprobar Kits de Reparación</h4>
            </div>
            <p className="text-sm text-muted mb-auto">{dashboardData?.actions?.kits?.total_pending?.toLocaleString() || 32} solicitudes de kits de reparación de mantenimiento están pendientes de aprobación.</p>
            <button className="btn btn-neutral w-full mt-lg" onClick={() => setActiveModal('kits')}>Revisar Solicitudes</button>
          </div>

          <div className="card action-card">
            <div className="action-header">
              <TrendingUp size={20} className="text-primary" />
              <h4 className="font-bold">Revisar Precios Aftermarket</h4>
            </div>
            <p className="text-sm text-muted mb-auto">Nueva data de mercado sugiere oportunidad de ajuste de precios en filtros hidráulicos.</p>
            <button className="btn btn-neutral w-full mt-lg" onClick={() => setActiveModal('prices')}>Analizar Data</button>
          </div>
        </div>
      </div>

      {/* Modal - Campaña */}
      {activeModal === 'campaign' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Iniciar Campaña de Contacto</h3>
              <button onClick={() => setActiveModal(null)} className="btn-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              {emailSent ? (
                <div className="success-state">
                  <CheckCircle size={48} className="text-success" />
                  <h4>¡Campaña enviada con éxito!</h4>
                  <p>Los distribuidores recibirán la notificación en breve.</p>
                </div>
              ) : (
                <div className="email-form">
                  <div className="form-group">
                    <label>Para:</label>
                    <input type="text" value={`${topDist} (Distribuidores)`} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Asunto:</label>
                    <input type="text" value={`URGENTE: ${topUnits.toLocaleString()} Unidades críticas con servicios vencidos`} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Mensaje:</label>
                    <textarea rows={5} defaultValue={`Estimado equipo de ${topDist},\n\nHemos detectado que tienen ${topUnits.toLocaleString()} unidades en su región que han superado el límite de tolerancia para su mantenimiento preventivo. Les solicitamos contactar a los clientes inmediatamente para agendar citas de servicio.\n\nAdjunto la lista de unidades.`}></textarea>
                  </div>
                  <button className="btn btn-primary w-full" onClick={handleSendEmail}>
                    <Send size={16} /> Enviar Comunicado
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal - Kits */}
      {activeModal === 'kits' && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3>Revisar Solicitudes de Kits</h3>
              <button onClick={() => setActiveModal(null)} className="btn-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID REQ</th>
                    <th>DISTRIBUIDOR</th>
                    <th>TIPO DE KIT</th>
                    <th>ESTATUS</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td className="font-bold">{req.id}</td>
                      <td>{req.dist}</td>
                      <td>{req.kit}</td>
                      <td>
                        <span className={`badge ${req.status === 'Pendiente' ? 'badge-warning' : req.status === 'Aprobado' ? 'badge-neutral' : 'badge-critical'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'Pendiente' && (
                          <div className="action-buttons">
                            <button className="btn-small btn-approve" onClick={() => handleApprove(req.id)}>Aprobar</button>
                            <button className="btn-small btn-reject" onClick={() => handleReject(req.id)}>Rechazar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Precios */}
      {activeModal === 'prices' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Análisis de Precios: Filtros Hidráulicos</h3>
              <button onClick={() => setActiveModal(null)} className="btn-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="price-analysis">
                <div className="price-cards">
                  <div className="price-stat">
                    <span>Precio Promedio CNH</span>
                    <h4>$45.00 USD</h4>
                  </div>
                  <div className="price-stat">
                    <span>Precio Mercado (Competencia)</span>
                    <h4 className="text-warning">$49.50 USD</h4>
                  </div>
                </div>
                
                <div className="opportunity-box">
                  <TrendingUp size={24} className="text-success" />
                  <div>
                    <h5>Oportunidad de Ajuste: +10%</h5>
                    <p>Subir el precio a <strong>$48.00 USD</strong> mantendría competitividad y generaría +$24k estimados este trimestre.</p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn btn-primary w-full" onClick={() => {
                    alert('Ajuste de precio aplicado exitosamente');
                    setActiveModal(null);
                  }}>Aplicar Nuevo Precio ($48.00)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
