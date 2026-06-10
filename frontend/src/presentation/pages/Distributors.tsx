import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Tractor } from 'lucide-react';
import './Distributors.css';

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

interface DatosDistribuidores {
  total_distribuidores: number;
  pendientes_por_atender: number;
  unidades_alerta_roja: number;
  top_distribuidores: TopDistribuidor[];
  lista_unidades: UnidadLista[];
}

const calcularProximoServicio = (horas: number): string => {
  if (horas === undefined || horas === null || isNaN(horas) || horas === 0) return "No disponible";
  
  const intervalos = [300, 600, 900, 1200, 1500, 1800, 2100, 2400];
  for (let intervalo of intervalos) {
    if (horas < intervalo) {
      return `${intervalo} hrs`;
    }
  }
  return "No disponible";
};

const obtenerColorRiesgo = (riesgo: string): string => {
  const r = riesgo.toLowerCase();
  if (r === 'high' || r === 'crítico' || r === 'alto') return 'text-critical font-bold';
  if (r === 'medium' || r === 'medio') return 'text-warning font-bold';
  if (r === 'low' || r === 'bajo') return 'text-success font-bold';
  return 'text-muted';
};

const obtenerClaseRiesgoBg = (riesgo: string): string => {
  const r = riesgo.toLowerCase();
  if (r === 'high' || r === 'crítico' || r === 'alto') return 'bg-critical text-white';
  if (r === 'medium' || r === 'medio') return 'bg-warning text-white';
  if (r === 'low' || r === 'bajo') return 'bg-success text-white';
  return 'bg-neutral text-main';
};

const obtenerClaseEstatus = (estatus: string): string => {
  const e = estatus.toLowerCase();
  if (e === 'pendiente') return 'badge-warning'; 
  if (e === 'cerradafuera' || e === 'cerrada fuera') return 'badge-primary'; 
  if (e === 'cerrada') return 'badge-success'; 
  if (e === 'porvencer') return 'badge-warning';
  return 'badge-neutral';
};

// Paleta de colores Reds_r (de oscuro a claro)
const obtenerColorRojo = (index: number, total: number): string => {
  const palette = [
    '#67000d', '#a50f15', '#cb181d', '#ef3b2c', '#fb6a4a', 
    '#fc9272', '#fcbba1', '#fee0d2', '#fff5f0', '#ffffff'
  ];
  return palette[Math.min(index, palette.length - 1)];
};

export const Distributors: React.FC = () => {
  const [datos, setDatos] = useState<DatosDistribuidores | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatosDistribuidores = async () => {
      try {
        const respuesta = await fetch('http://localhost:5001/api/distribuidores');
        const json = await respuesta.json();
        
        if (json.success && json.data) {
          setDatos(json.data);
        } else {
          setError(json.error || "Error al cargar datos");
        }
      } catch (err) {
        setError("Error de conexión con el backend");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosDistribuidores();
  }, []);

  if (cargando) {
    return <div className="distributors-page p-4">Cargando datos de distribuidores...</div>;
  }

  if (error) {
    return <div className="distributors-page p-4 text-critical">Error: {error}</div>;
  }

  if (!datos) {
    return <div className="distributors-page p-4">No hay datos disponibles</div>;
  }

  return (
    <div className="distributors-page">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Distribuidores</h1>
      </div>

      <div className="metrics-grid dist-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid black', color: 'black' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Tractor size={40} color="black" />
            <div>
              <span className="kpi-title" style={{ fontSize: '14px', color: 'black', fontWeight: 'bold' }}>Distribuidores</span>
              <div className="kpi-value-row" style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="kpi-value" style={{ fontSize: '28px', fontWeight: 'bold', color: 'black' }}>{datos.total_distribuidores}</span>
                <span style={{ fontSize: '12px', marginLeft: '8px', color: 'black' }}>Registrados</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid black', color: 'black' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FileText size={40} color="black" />
            <div>
              <span className="kpi-title" style={{ fontSize: '14px', color: 'black', fontWeight: 'bold' }}>Pendientes por Atender</span>
              <div className="kpi-value-row" style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="kpi-value" style={{ fontSize: '28px', fontWeight: 'bold', color: 'black' }}>{datos.pendientes_por_atender}</span>
                <span style={{ fontSize: '12px', marginLeft: '8px', color: 'black' }}>Estatus Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card kpi-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid black', color: 'black' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle size={40} color="black" />
            <div>
              <span className="kpi-title" style={{ fontSize: '14px', color: 'black', fontWeight: 'bold' }}>Unidades en Alerta Roja</span>
              <div className="kpi-value-row" style={{ display: 'flex', alignItems: 'baseline' }}>
                <span className="kpi-value" style={{ fontSize: '28px', fontWeight: 'bold', color: 'black' }}>{datos.unidades_alerta_roja}</span>
                <span style={{ fontSize: '12px', marginLeft: '8px', color: 'black' }}>Requieren acción</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Lado izquierdo: Tablas */}
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
                    <th style={{ padding: '8px', textAlign: 'center' }}>Porcentaje entre<br/>todas las unidades</th>
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

          {/* Tabla completa de unidades */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 className="card-title" style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Unidades</h3>
              <span style={{ fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Ver más</span>
            </div>
            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="clean-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-main)' }}>
                    <th style={{ padding: '8px' }}>Unidad</th>
                    <th style={{ padding: '8px' }}>Distribuidor</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Estatus</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Riesgo</th>
                    <th style={{ padding: '8px' }}>Próximo servicio</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.lista_unidades.map((unidad, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-bg)' }}>
                      <td style={{ padding: '10px 8px' }} className="text-main">{unidad.unidad}</td>
                      <td style={{ padding: '10px 8px' }} className="text-main">{unidad.distribuidor}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${obtenerClaseEstatus(unidad.estatus)}`}>
                          {unidad.estatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${obtenerClaseRiesgoBg(unidad.riesgo)}`}>
                          {unidad.riesgo}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px' }} className="text-main">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{calcularProximoServicio(unidad.horas_actuales)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {datos.lista_unidades.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '10px 8px', textAlign: 'center' }}>No hay unidades disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado derecho: Gráfica */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>Top 10 Distribuidores con Unidades en Alerta Roja</h3>
          <div style={{ display: 'flex', gap: '5px', height: '400px', padding: '20px 40px 60px 40px', position: 'relative', borderLeft: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            {/* Eje Y simplificado */}
            <div style={{ position: 'absolute', left: '-5px', top: 0, bottom: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '10px', color: '#666' }}>
              <span>1200</span>
              <span>1000</span>
              <span>800</span>
              <span>600</span>
              <span>400</span>
              <span>200</span>
              <span>0</span>
            </div>
            
            {/* Títulos de Ejes */}
            <div style={{ position: 'absolute', left: '-35px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '12px', color: '#666' }}>
              Número de Unidades en Alerta Roja
            </div>
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>
              DISTRIBUIDOR
            </div>

            {/* Barras */}
            {datos.top_distribuidores.map((d, i) => {
              const maxVal = Math.max(...datos.top_distribuidores.map(x => x.unidades_alerta_roja)) || 1;
              // Ajustamos maxVal para que las barras se vean bien (ej. 1200 si el max es 1100)
              const chartMax = Math.ceil(maxVal / 200) * 200;
              const alturaPct = (d.unidades_alerta_roja / chartMax) * 100;
              
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '80%', 
                      height: `${alturaPct}%`, 
                      backgroundColor: obtenerColorRojo(i, datos.top_distribuidores.length),
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                    title={`${d.distribuidor}: ${d.unidades_alerta_roja}`}
                  ></div>
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#333', 
                    marginTop: '5px',
                    transform: 'rotate(45deg)',
                    transformOrigin: 'top left',
                    whiteSpace: 'nowrap',
                    width: '10px'
                  }}>
                    {d.distribuidor.substring(0, 15)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
