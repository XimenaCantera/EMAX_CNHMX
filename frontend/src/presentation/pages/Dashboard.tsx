import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { SinDatos } from '../components/common/SinDatos';
import { API_BASE_URL } from '../../config';

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
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Variables de estado para filtros y ordenamientos
  const [busquedaTabla, setBusquedaTabla] = useState('');
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState('');
  const [estatusSeleccionado, setEstatusSeleccionado] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [filtroCantidadServicios, setFiltroCantidadServicios] = useState('todos');
  const [filtroPotencial, setFiltroPotencial] = useState('todos');
  const [ordenSeleccionado, setOrdenSeleccionado] = useState('sin_orden');

  // Funciones de conversión/sanitización
  const obtenerNumeroPotencial = (valorPotencial: any): number => {
    if (typeof valorPotencial === 'number') return valorPotencial;
    if (!valorPotencial) return 0;
    const cadenaLimpia = String(valorPotencial).replace(/[^0-9.-]/g, '');
    return parseFloat(cadenaLimpia) || 0;
  };

  const obtenerNumeroServicios = (cantidadServicios: any): number => {
    if (typeof cantidadServicios === 'number') return cantidadServicios;
    if (!cantidadServicios) return 0;
    const cadenaLimpia = String(cantidadServicios).replace(/[^0-9.-]/g, '');
    return parseFloat(cadenaLimpia) || 0;
  };

  const obtenerHorasActuales = (horas: any): number => {
    if (typeof horas === 'number') return horas;
    if (!horas) return 0;
    const cadenaLimpia = String(horas).replace(/[^0-9.-]/g, '');
    return parseFloat(cadenaLimpia) || 0;
  };

  // Restablecer filtros a valores iniciales
  const limpiarFiltros = () => {
    setBusquedaTabla('');
    setDistribuidorSeleccionado('');
    setEstatusSeleccionado('');
    setServicioSeleccionado('');
    setFiltroCantidadServicios('todos');
    setFiltroPotencial('todos');
    setOrdenSeleccionado('sin_orden');
  };

  // Extraer listas únicas de filtros basadas en los datos reales
  const todasLasOportunidades = data?.todas_oportunidades || [];

  const distribuidoresDisponibles = Array.from(
    new Set(todasLasOportunidades.map(op => op.distribuidor).filter(Boolean))
  ).sort();

  const estatusDisponibles = Array.from(
    new Set(todasLasOportunidades.map(op => op.estado).filter(Boolean))
  ).sort();

  const serviciosDisponibles = Array.from(
    new Set(todasLasOportunidades.map(op => op.proximo_servicio).filter(Boolean))
  ).sort();

  // 1. Filtrado de datos combinando todas las reglas
  const unidadesFiltradas = todasLasOportunidades.filter(op => {
    // Buscador general por alias (unidad) o distribuidor
    const terminoBusqueda = busquedaTabla.toLowerCase().trim();
    if (terminoBusqueda) {
      const coincideAlias = op.unidad?.toLowerCase().includes(terminoBusqueda);
      const coincideDistribuidor = op.distribuidor?.toLowerCase().includes(terminoBusqueda);
      if (!coincideAlias && !coincideDistribuidor) {
        return false;
      }
    }

    // Filtro por distribuidor
    if (distribuidorSeleccionado && op.distribuidor !== distribuidorSeleccionado) {
      return false;
    }

    // Filtro por estatus
    if (estatusSeleccionado && op.estado !== estatusSeleccionado) {
      return false;
    }

    // Filtro por próximo servicio
    if (servicioSeleccionado && op.proximo_servicio !== servicioSeleccionado) {
      return false;
    }

    // Filtro por cantidad de servicios
    const serviciosNumerico = obtenerNumeroServicios(op.servicios_cnt);
    if (filtroCantidadServicios !== 'todos') {
      if (filtroCantidadServicios === 'cero' && serviciosNumerico !== 0) return false;
      if (filtroCantidadServicios === 'uno' && serviciosNumerico !== 1) return false;
      if (filtroCantidadServicios === 'dos_o_mas' && serviciosNumerico < 2) return false;
      if (filtroCantidadServicios === 'cinco_o_mas' && serviciosNumerico < 5) return false;
    }

    // Filtro por potencial económico
    const potencialNumerico = obtenerNumeroPotencial(op.potencial);
    if (filtroPotencial !== 'todos') {
      if (filtroPotencial === 'igual_cero' && potencialNumerico !== 0) return false;
      if (filtroPotencial === 'mayor_cero' && potencialNumerico <= 0) return false;
      if (filtroPotencial === 'mayor_5000' && potencialNumerico <= 5000) return false;
      if (filtroPotencial === 'mayor_10000' && potencialNumerico <= 10000) return false;
      if (filtroPotencial === 'mayor_25000' && potencialNumerico <= 25000) return false;
      if (filtroPotencial === 'mayor_50000' && potencialNumerico <= 50000) return false;
      if (filtroPotencial === 'mayor_100000' && potencialNumerico <= 100000) return false;
    }

    return true;
  });

  // 2. Ordenamiento de los datos filtrados
  const unidadesOrdenadas = [...unidadesFiltradas].sort((a, b) => {
    if (ordenSeleccionado === 'mayor_potencial') {
      return obtenerNumeroPotencial(b.potencial) - obtenerNumeroPotencial(a.potencial);
    }
    if (ordenSeleccionado === 'menor_potencial') {
      return obtenerNumeroPotencial(a.potencial) - obtenerNumeroPotencial(b.potencial);
    }
    if (ordenSeleccionado === 'mayor_servicios') {
      return obtenerNumeroServicios(b.servicios_cnt) - obtenerNumeroServicios(a.servicios_cnt);
    }
    if (ordenSeleccionado === 'menor_servicios') {
      return obtenerNumeroServicios(a.servicios_cnt) - obtenerNumeroServicios(b.servicios_cnt);
    }
    if (ordenSeleccionado === 'mas_horas') {
      return obtenerHorasActuales(b.horas_actuales) - obtenerHorasActuales(a.horas_actuales);
    }
    if (ordenSeleccionado === 'menos_horas') {
      return obtenerHorasActuales(a.horas_actuales) - obtenerHorasActuales(b.horas_actuales);
    }
    if (ordenSeleccionado === 'distribuidor_az') {
      return (a.distribuidor || '').localeCompare(b.distribuidor || '');
    }
    if (ordenSeleccionado === 'alias_az') {
      return (a.unidad || '').localeCompare(b.unidad || '');
    }
    return 0;
  });

  // 3. Cálculos de indicadores
  const totalUnidades = todasLasOportunidades.length;
  const potencialFiltrado = unidadesFiltradas.reduce(
    (acumulado, op) => acumulado + obtenerNumeroPotencial(op.potencial),
    0
  );

  const cargarDatosDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard');
      const json = await response.json();

      if (response.ok && json.success) {
        setData(json.data);
      } else if (json.no_data) {
        setError('no_data');
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

  // Dar formato de moneda
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
    const isNoData = error === 'no_data' || (error && error.includes('No such file or directory'));
    if (isNoData) {
      return <SinDatos />;
    }
    return (
      <div className="dashboard-error card">
        <AlertTriangle size={48} className="text-secondary" />
        <h2>Error al cargar el Dashboard</h2>
        <p className="error-message">{error || 'No hay datos disponibles.'}</p>
        <div className="error-actions">
          <button className="btn btn-primary" onClick={cargarDatosDashboard}>
            <RefreshCw size={16} /> Reintentar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/import')}>
            Ir a Importar Datos
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="dashboard-page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1>Panel de Monetización CNH</h1>
          <p className="text-muted" style={{ marginTop: '6px', fontSize: '0.875rem', color: '#6b7280' }}>
            Este panel muestra una información general de la oportunidad de mercado que hay en refacciones y servicios, ayudando a priorizar a los distribuidores y unidades con mayor oportunidad técnica y económica.
          </p>
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

          <div style={{ height: '280px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}>
            <iframe
              src="/dash/dashboard/donut/"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Urgencia de Servicios"
            />
          </div>

          <div className="donut-download-btn-wrapper">
            <a
              href="/api/download/tabla-riesgo"
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


            <a href="/distributors" className="btn btn-neutral w-full mt-lg text-center">
              Revisar solicitudes
            </a>
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
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '1100px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="font-bold text-lg" style={{ color: '#20235C', margin: 0 }}>Panel Detallado</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Contenedor de Filtros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: '1px solid #E2E8F0'
              }}>

                {/* Buscador General */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Buscador General</label>
                  <input
                    type="text"
                    value={busquedaTabla}
                    onChange={(e) => setBusquedaTabla(e.target.value)}
                    placeholder="Buscar por alias, serie o distribuidor..."
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                {/* Filtro por Distribuidor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Distribuidor</label>
                  <select
                    value={distribuidorSeleccionado}
                    onChange={(e) => setDistribuidorSeleccionado(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
                  >
                    <option value="">Todos los distribuidores</option>
                    {distribuidoresDisponibles.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estatus */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Estatus</label>
                  <select
                    value={estatusSeleccionado}
                    onChange={(e) => setEstatusSeleccionado(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
                  >
                    <option value="">Todos los estatus</option>
                    {estatusDisponibles.map(est => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Próximo Servicio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Próximo Servicio</label>
                  <select
                    value={servicioSeleccionado}
                    onChange={(e) => setServicioSeleccionado(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
                  >
                    <option value="">Todos los servicios</option>
                    {serviciosDisponibles.map(srv => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Cantidad de Servicios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Cant. de Servicios</label>
                  <select
                    value={filtroCantidadServicios}
                    onChange={(e) => setFiltroCantidadServicios(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
                  >
                    <option value="todos">Todos</option>
                    <option value="cero">0 servicios</option>
                    <option value="uno">1 servicio</option>
                    <option value="dos_o_mas">2 o más servicios</option>
                    <option value="cinco_o_mas">5 o más servicios</option>
                  </select>
                </div>

                {/* Filtro por Potencial Económico */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Potencial Económico</label>
                  <select
                    value={filtroPotencial}
                    onChange={(e) => setFiltroPotencial(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
                  >
                    <option value="todos">Todos</option>
                    <option value="igual_cero">$0</option>
                    <option value="mayor_cero">Mayor a $0</option>
                    <option value="mayor_5000">Mayor a $5,000</option>
                    <option value="mayor_10000">Mayor a $10,000</option>
                    <option value="mayor_25000">Mayor a $25,000</option>
                    <option value="mayor_50000">Mayor a $50,000</option>
                    <option value="mayor_100000">Mayor a $100,000</option>
                  </select>
                </div>

                {/* Ordenamiento */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#20235C' }}>Ordenamiento</label>
                  <select
                    value={ordenSeleccionado}
                    onChange={(e) => setOrdenSeleccionado(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '13px', backgroundColor: 'white' }}
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
                </div>

                {/* Botón Limpiar Filtros */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={limpiarFiltros}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #20235C',
                      backgroundColor: 'transparent',
                      color: '#20235C',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      height: '38px',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#20235C';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#20235C';
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>

              </div>

              {/* Indicadores */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
                color: '#475569',
                padding: '0 4px'
              }}>
                <div>
                  Mostrando <strong style={{ color: '#20235C' }}>{unidadesFiltradas.length}</strong> de <strong style={{ color: '#64748b' }}>{totalUnidades}</strong> unidades
                </div>
                <div>
                  Potencial filtrado: <strong style={{ color: '#20235C', fontSize: '15px' }}>{formatMoney(potencialFiltrado)}</strong>
                </div>
              </div>

              {/* Tabla o Estado Vacío */}
              {unidadesOrdenadas.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '15px',
                  fontWeight: 500,
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1'
                }}>
                  No se encontraron unidades con estos filtros.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%' }}>
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
                      {unidadesOrdenadas.map((op, idx) => (
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
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};