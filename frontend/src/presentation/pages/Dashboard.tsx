import React, { useState, useEffect, useMemo } from 'react';
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
//Usamos lucide-react para poner íconos en las tarjetas del dashboard.

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para filtros del Panel Detallado
  const [busquedaTabla, setBusquedaTabla] = useState('');
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState('todos');
  const [estatusSeleccionado, setEstatusSeleccionado] = useState('todos');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('todos');
  const [filtroCantidadServicios, setFiltroCantidadServicios] = useState('todos');
  const [filtroPotencial, setFiltroPotencial] = useState('todos');
  const [ordenSeleccionado, setOrdenSeleccionado] = useState('sin_orden');

  // Helpers de conversión numérica
  const obtenerNumeroServicios = (texto?: number | string) => {
    if (typeof texto === 'number') return texto;
    if (!texto) return 0;
    const match = String(texto).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const obtenerHorasActuales = (texto?: number | string) => {
    if (typeof texto === 'number') return texto;
    if (!texto) return 0;
    const match = String(texto).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const obtenerNumeroPotencial = (valor?: number | string) => {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;
    const cleanStr = String(valor).replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const limpiarFiltros = () => {
    setBusquedaTabla('');
    setDistribuidorSeleccionado('todos');
    setEstatusSeleccionado('todos');
    setServicioSeleccionado('todos');
    setFiltroCantidadServicios('todos');
    setFiltroPotencial('todos');
    setOrdenSeleccionado('sin_orden');
  };

  // Opciones únicas extraídas de los datos reales
  const todasOportunidades = data?.todas_oportunidades || [];

  const distribuidoresDisponibles = useMemo(() => {
    const dist = new Set(todasOportunidades.map(op => op.distribuidor).filter(Boolean));
    return Array.from(dist).sort();
  }, [todasOportunidades]);

  const estatusDisponibles = useMemo(() => {
    const est = new Set(todasOportunidades.map(op => op.estado).filter(Boolean));
    return Array.from(est).sort();
  }, [todasOportunidades]);

  const serviciosDisponibles = useMemo(() => {
    const serv = new Set(todasOportunidades.map(op => op.proximo_servicio).filter(Boolean));
    return Array.from(serv).sort();
  }, [todasOportunidades]);

  // Aplicar filtros
  const unidadesFiltradas = useMemo(() => {
    let result = todasOportunidades;

    if (busquedaTabla) {
      const q = busquedaTabla.toLowerCase();
      result = result.filter(op => 
        (op.unidad && op.unidad.toLowerCase().includes(q)) || 
        (op.distribuidor && op.distribuidor.toLowerCase().includes(q))
      );
    }

    if (distribuidorSeleccionado !== 'todos') {
      result = result.filter(op => op.distribuidor === distribuidorSeleccionado);
    }

    if (estatusSeleccionado !== 'todos') {
      result = result.filter(op => op.estado === estatusSeleccionado);
    }

    if (servicioSeleccionado !== 'todos') {
      result = result.filter(op => op.proximo_servicio === servicioSeleccionado);
    }

    if (filtroCantidadServicios !== 'todos') {
      result = result.filter(op => {
        const cant = obtenerNumeroServicios(op.servicios_cnt);
        if (filtroCantidadServicios === 'cero') return cant === 0;
        if (filtroCantidadServicios === 'uno') return cant === 1;
        if (filtroCantidadServicios === 'dos_o_mas') return cant >= 2;
        if (filtroCantidadServicios === 'cinco_o_mas') return cant >= 5;
        return true;
      });
    }

    if (filtroPotencial !== 'todos') {
      result = result.filter(op => {
        const val = obtenerNumeroPotencial(op.potencial);
        if (filtroPotencial === 'igual_cero') return val === 0;
        if (filtroPotencial === 'mayor_cero') return val > 0;
        if (filtroPotencial === 'mayor_5000') return val > 5000;
        if (filtroPotencial === 'mayor_10000') return val > 10000;
        if (filtroPotencial === 'mayor_25000') return val > 25000;
        if (filtroPotencial === 'mayor_50000') return val > 50000;
        if (filtroPotencial === 'mayor_100000') return val > 100000;
        return true;
      });
    }

    return result;
  }, [todasOportunidades, busquedaTabla, distribuidorSeleccionado, estatusSeleccionado, servicioSeleccionado, filtroCantidadServicios, filtroPotencial]);

  // Aplicar ordenamiento
  const unidadesOrdenadas = useMemo(() => {
    if (ordenSeleccionado === 'sin_orden') return unidadesFiltradas;

    return [...unidadesFiltradas].sort((a, b) => {
      switch (ordenSeleccionado) {
        case 'mayor_potencial':
          return obtenerNumeroPotencial(b.potencial) - obtenerNumeroPotencial(a.potencial);
        case 'menor_potencial':
          return obtenerNumeroPotencial(a.potencial) - obtenerNumeroPotencial(b.potencial);
        case 'mayor_servicios':
          return obtenerNumeroServicios(b.servicios_cnt) - obtenerNumeroServicios(a.servicios_cnt);
        case 'menor_servicios':
          return obtenerNumeroServicios(a.servicios_cnt) - obtenerNumeroServicios(b.servicios_cnt);
        case 'mas_horas':
          return obtenerHorasActuales(b.horas_actuales) - obtenerHorasActuales(a.horas_actuales);
        case 'menos_horas':
          return obtenerHorasActuales(a.horas_actuales) - obtenerHorasActuales(b.horas_actuales);
        case 'distribuidor_az':
          return (a.distribuidor || '').localeCompare(b.distribuidor || '');
        case 'alias_az':
          return (a.unidad || '').localeCompare(b.unidad || '');
        default:
          return 0;
      }
    });
  }, [unidadesFiltradas, ordenSeleccionado]);

  const totalUnidades = unidadesFiltradas.length;
  const potencialFiltrado = unidadesFiltradas.reduce((sum, op) => sum + obtenerNumeroPotencial(op.potencial), 0);

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
                <span className="legend-label">
                  Crítico: {datosDona.critico_pct}% {datosDona.critico_cnt !== undefined ? `(${datosDona.critico_cnt.toLocaleString('es-MX')})` : ''}
                </span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#B45309' }}></span>
                <span className="legend-label">
                  Alto: {datosDona.alto_pct}% {datosDona.alto_cnt !== undefined ? `(${datosDona.alto_cnt.toLocaleString('es-MX')})` : ''}
                </span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#20235C' }}></span>
                <span className="legend-label">
                  Medio: {datosDona.medio_pct}% {datosDona.medio_cnt !== undefined ? `(${datosDona.medio_cnt.toLocaleString('es-MX')})` : ''}
                </span>
              </div>

              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#E5E7EB' }}></span>
                <span className="legend-label">
                  Bajo: {datosDona.bajo_pct}% {datosDona.bajo_cnt !== undefined ? `(${datosDona.bajo_cnt.toLocaleString('es-MX')})` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="donut-download-btn-wrapper">
            <a
              href="http://127.0.0.1:5001/api/download/tabla-riesgo"
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

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="font-bold text-lg">Panel Detallado</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                {/* Buscador general */}
                <input 
                  type="text" 
                  placeholder="Buscar por alias, serie o distribuidor..." 
                  value={busquedaTabla} 
                  onChange={e => setBusquedaTabla(e.target.value)} 
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                />

                {/* Filtro por distribuidor */}
                <select 
                  value={distribuidorSeleccionado} 
                  onChange={e => setDistribuidorSeleccionado(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="todos">Todos los distribuidores</option>
                  {distribuidoresDisponibles.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Filtro por estatus */}
                <select 
                  value={estatusSeleccionado} 
                  onChange={e => setEstatusSeleccionado(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="todos">Todos los estatus</option>
                  {estatusDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
                </select>

                {/* Filtro por próximo servicio */}
                <select 
                  value={servicioSeleccionado} 
                  onChange={e => setServicioSeleccionado(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="todos">Todos los servicios</option>
                  {serviciosDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {/* Filtro por cantidad de servicios */}
                <select 
                  value={filtroCantidadServicios} 
                  onChange={e => setFiltroCantidadServicios(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="todos">Todos los rangos (servicios)</option>
                  <option value="cero">0 servicios</option>
                  <option value="uno">1 servicio</option>
                  <option value="dos_o_mas">2 o más servicios</option>
                  <option value="cinco_o_mas">5 o más servicios</option>
                </select>

                {/* Filtro por potencial */}
                <select 
                  value={filtroPotencial} 
                  onChange={e => setFiltroPotencial(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="todos">Todos los potenciales</option>
                  <option value="igual_cero">$0</option>
                  <option value="mayor_cero">Mayor a $0</option>
                  <option value="mayor_5000">Mayor a $5,000</option>
                  <option value="mayor_10000">Mayor a $10,000</option>
                  <option value="mayor_25000">Mayor a $25,000</option>
                  <option value="mayor_50000">Mayor a $50,000</option>
                  <option value="mayor_100000">Mayor a $100,000</option>
                </select>

                {/* Ordenamiento */}
                <select 
                  value={ordenSeleccionado} 
                  onChange={e => setOrdenSeleccionado(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                >
                  <option value="sin_orden">Sin orden específico</option>
                  <option value="mayor_potencial">Mayor potencial económico</option>
                  <option value="menor_potencial">Menor potencial económico</option>
                  <option value="mayor_servicios">Mayor cantidad de servicios</option>
                  <option value="menor_servicios">Menor cantidad de servicios</option>
                  <option value="mas_horas">Más horas actuales</option>
                  <option value="menos_horas">Menos horas actuales</option>
                  <option value="distribuidor_az">Distribuidor A-Z</option>
                  <option value="alias_az">Alias / Serie A-Z</option>
                </select>

                {/* Limpiar Filtros */}
                <button onClick={limpiarFiltros} style={{ padding: '8px 12px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  Limpiar filtros
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontSize: '14px', fontWeight: 'bold' }}>
                <span>Mostrando {totalUnidades} de {todasOportunidades.length} unidades</span>
                <span style={{ color: '#1E3A8A' }}>Potencial filtrado: {formatMoney(potencialFiltrado)}</span>
              </div>
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
                  {unidadesOrdenadas.length > 0 ? (
                    unidadesOrdenadas.map((op, idx) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6B7280', fontWeight: '500' }}>
                        No se encontraron unidades con estos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};