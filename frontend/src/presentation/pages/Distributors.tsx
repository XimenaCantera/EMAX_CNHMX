import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Users, Tractor } from 'lucide-react';
import './Distributors.css';
import { SinDatos } from '../components/common/SinDatos';
import { API_BASE_URL } from '../../config';

interface TopDistribuidor {
  distribuidor: string;
  unidades_alerta_roja: number;
  total_unidades: number;
  porcentaje_alerta: number;
}

interface UnidadLista {
  unidad: string;
  distribuidor: string;
  estatus: string;
  riesgo: string;
  horas_actuales: number;
}

interface TopCiudad {
  Ciudad: string;
  Estado: string;
  unidades_prioritarias: number;
  criticas: number;
  altas: number;
  servicios_oportunidad: number;
}

interface DatosDistribuidores {
  total_distribuidores: number;
  pendientes_por_atender: number;
  unidades_alerta_roja: number;
  unidades_agricultura: number;
  unidades_otros: number;
  top_distribuidores: TopDistribuidor[];
  lista_unidades: UnidadLista[];
  recomendaciones?: {
    nota_ejecutiva?: string;
    top_5_ciudades?: TopCiudad[];
  };
}

export const Distributors: React.FC = () => {
  const [datos, setDatos] = useState<DatosDistribuidores | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/distribuidores`);
        const json = await respuesta.json();

        if (json.success && json.data) {
          setDatos(json.data);
        } else if (json.no_data) {
          setError('no_data');
        } else {
          setError(json.error || 'Error al cargar los datos');
        }
      } catch (err) {
        console.error("Error cargando distribuidores:", err);
        setError('Error de conexión al servidor');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  if (cargando) {
    return <div className="distributors-page p-4">Cargando datos de distribuidores...</div>;
  }

  if (error || !datos) {
    if (error === 'no_data' || (error && error.includes('No such file or directory'))) {
      return <SinDatos />;
    }
    return <div className="distributors-page p-4">{error || 'No hay datos disponibles'}</div>;
  }

  return (
    <div className="distributors-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Distribuidores</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '6px' }}>
          Este panel evalúa el desempeño de cada distribuidor en la atención de alertas y volumen total de unidades asignadas. Ayuda a identificar los distribuidores rezagados y zonas de alta prioridad operativa.
        </p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">DISTRIBUIDORES REGISTRADOS</span>
            <Users size={18} className="text-muted" />
          </div>
          <div className="kpi-value">
            {datos.total_distribuidores}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">PENDIENTES POR ATENDER</span>
            <FileText size={18} className="text-muted" />
          </div>
          <div className="kpi-value">
            {datos.pendientes_por_atender}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">UNIDADES EN ALERTA ROJA</span>
            <AlertTriangle size={18} className="text-warning" />
          </div>
          <div className="kpi-value text-warning">
            {datos.unidades_alerta_roja}
          </div>
        </div>

        <div className="card kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">TIPO DE UNIDADES</span>
            <Tractor size={18} className="text-muted" />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="kpi-value" style={{ color: '#2E7D32' }}>{datos.unidades_agricultura}</span>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginTop: '-4px' }}>Agricultura</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="kpi-value" style={{ color: '#9CA3AF' }}>{datos.unidades_otros}</span>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500', marginTop: '-4px' }}>Otros</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Lado izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tabla Top Distribuidores */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>Top distribuidores con Unidades en Alerta Roja</h3>
            <div className="table-responsive">
              <table className="clean-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-main)' }}>
                    <th style={{ padding: '8px' }}>Distribuidor</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Unidades en Alerta Roja</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Total de unidades</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Porcentaje entre<br />todas las unidades</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.top_distribuidores.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--color-bg)' }}>
                      <td style={{ padding: '12px 8px' }} className="text-main">{item.distribuidor}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }} className="text-main">{item.unidades_alerta_roja}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }} className="text-main">{item.total_unidades}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }} className="text-main">{item.porcentaje_alerta.toFixed(2)}%</td>
                    </tr>
                  ))}
                  {datos.top_distribuidores.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px 8px', textAlign: 'center' }}>No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>Top 10 Distribuidores con Unidades en Alerta Roja</h3>
          <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe
              src={`${API_BASE_URL}/dash/distribuidores/bar/`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Top Distribuidores"
            />
          </div>
        </div>
      </div>

      <div className="card map-card" style={{ marginTop: '24px' }}>
        <h3 className="card-title">CONCENTRACIÓN GEOGRÁFICA DE UNIDADES CRÍTICAS Y ALTAS</h3>
        <div style={{ height: '700px', width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}>
          <iframe
            src={`${API_BASE_URL}/api/mapa`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Mapa de Riesgo"
          />
        </div>
        {datos.recomendaciones?.nota_ejecutiva && (
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p className="text-sm" style={{ color: '#374151', lineHeight: '1.5' }}>
              {datos.recomendaciones.nota_ejecutiva}
            </p>
          </div>
        )}

        {datos.recomendaciones?.top_5_ciudades && datos.recomendaciones.top_5_ciudades.length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <h4 className="font-bold mb-4" style={{ fontSize: '18px', color: '#111827', marginBottom: '16px' }}>Top 5 ciudades prioritarias para foco operativo</h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#111827', color: '#FFFFFF' }}>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Ciudad</th>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Estado</th>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Unidades<br />prioritarias</th>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Críticas</th>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Altas</th>
                    <th style={{ padding: '12px', border: '1px solid #E5E7EB', color: '#FFFFFF', textAlign: 'center' }}>Servicios en<br />oportunidad</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.recomendaciones.top_5_ciudades.map((ciudad, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.Ciudad}</td>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.Estado}</td>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.unidades_prioritarias}</td>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.criticas}</td>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.altas}</td>
                      <td style={{ padding: '12px', border: '1px solid #E5E7EB' }}>{ciudad.servicios_oportunidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
