import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import './ImportPage.css';
import { API_BASE_URL } from '../../config';

interface UploadMetadata {
  filename: string;
  size_bytes: number;
  rows: number;
  columns: string[];
  preview: Array<Record<string, any>>;
}

interface ImportResult {
  filename: string;
  success: boolean;
  error?: string;
  message?: string;
  metadata?: UploadMetadata;
}
// Variables de estado para controlar la interfaz y los datos
export const ImportPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importedResults, setImportedResults] = useState<ImportResult[] | null>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Valida que el archivo seleccionado realmente sea un Excel (.xlsx)
  const validateFiles = (files: File[] | FileList) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const validFiles: File[] = [];
    let hasInvalidExtension = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx') {
        // No agregar duplicados
        if (!selectedFiles.some(f => f.name === file.name)) {
          validFiles.push(file);
        }
      } else {
        hasInvalidExtension = true;
      }
    }

    if (hasInvalidExtension) {
      setErrorMsg("Solo se aceptan exceles. (Solo extensión .xlsx). Los archivos diferentes fueron omitidos.");
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Cuando el usuario suelta el archivo arrastrado
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Se ejecuta al dar clic en buscar archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(Array.from(e.target.files));
    }
  };

  // Abre el explorador de archivos del sistema al hacer clic
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Envía los archivos seleccionados al backend de Flask
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Mostrar una barra de carga dinámica
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 10;
      });
    }, 120);

    // Creamos la petición HTTP para enviar los archivos
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.results) {
        setImportedResults(data.results);

        const successCount = data.success_count ?? 0;
        const totalCount = data.total_count ?? 0;

        if (successCount === totalCount && totalCount > 0) {
          setSuccessMsg(`¡Se cargaron correctamente los ${totalCount} archivos!`);
          setErrorMsg(null);
        } else if (successCount > 0) {
          setSuccessMsg(`Carga parcial: ${successCount} de ${totalCount} archivos se procesaron con éxito.`);
          const failures = data.results
            .filter((r: any) => !r.success)
            .map((r: any) => `${r.filename}: ${r.error}`)
            .join(', ');
          setErrorMsg(`Errores en archivos: ${failures}`);
        } else {
          setSuccessMsg(null);
          const failures = data.results
            .filter((r: any) => !r.success)
            .map((r: any) => `${r.filename}: ${r.error}`)
            .join(', ');
          setErrorMsg(`Error en la carga: ${failures || data.error || "Ningún archivo pudo ser procesado."}`);
        }

        // Buscar el primer archivo que se subió bien
        const firstSuccessIdx = data.results.findIndex((r: any) => r.success);
        if (firstSuccessIdx !== -1) {
          setActivePreviewIndex(firstSuccessIdx);
        } else {
          setActivePreviewIndex(0);
        }
        setSelectedFiles([]);
      } else {
        setErrorMsg(data.error || "Ocurrió un error al subir los archivos.");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setErrorMsg("No se pudo conectar con el servidor backend. Asegúrate de que el servidor esté activo.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Convierte los bytes del archivo a un formato legible (KB, MB)
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="import-page">
      <div className="page-header">
        <h1>Importar información</h1>
      </div>


      {/* Guía de archivos requeridos */}
      <div className="card expected-files-guide" style={{ marginTop: '24px', padding: '24px' }}>
        <h3 className="card-title" style={{ marginBottom: '8px', fontSize: '1.1rem', fontWeight: 'bold', color: '#000000' }}>
          Guía de Archivos y Columnas Esperadas
        </h3>
        <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
          El sistema valida de forma automática el tipo de archivo al momento de importarlo. Se necesita subir los archivos con los siguientes nombres para los procesos del tablero analítico.
        </p>

        <div className="guide-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Mantenimientos</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>mantenimientos.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Contiene el registro de servicios de mantenimiento de las unidades.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>SERVICIO, ACTUAL, ESTATUS, ALIAS</code>
            </div>
          </div>

          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Unidades (Reporte)</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>unidades.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Contiene las especificaciones, fechas de alta y acumulado de aftermarket de los equipos.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>Alias, Fecha Alta, Cerrados, C.Fuera, Pendientes, Horometro</code>
            </div>
          </div>

          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Población (Severidad)</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>population.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Contiene la severidad y el estatus operativo general de cada equipo por número de serie.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>VIN (17 CHARACTERS), SEVERITY LEVEL, MODEL</code>
            </div>
          </div>

          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Horas de Trabajo</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>horas.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Registros de horas operadas por día o mensuales por unidad.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>Alias, IMEI, Latitud, Longitud, AAAA-MM</code>
            </div>
          </div>

          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Ruteo Geográfico / Distancia</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>ruteo.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Coordenadas geográficas de traslado o indicadores de distancia de ruta.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>Division, Distancia del Dia, Distancia de Ruta</code>
            </div>
          </div>

          <div className="guide-item" style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="font-bold text-sm" style={{ color: '#0f172a' }}>Distribuidores</span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>distribuidor.xlsx</span>
            </div>
            <p className="text-muted text-xs" style={{ marginBottom: '8px' }}>Listado de distribuidores autorizados asociados a zonas geográficas.</p>
            <div style={{ fontSize: '0.75rem' }}>
              <strong>Columnas requeridas:</strong> <code style={{ color: '#0369a1' }}>DISTRIBUIDOR, CIUDAD, ESTADO</code>
            </div>
          </div>
        </div>
      </div>

      <div className="card upload-card">
        <div className="upload-header">
          <h3 className="upload-title">Subir documento</h3>

          <div className="info-pills">
            <div className="info-pill">
              <div className="info-pill-icon">
                <FileSpreadsheet size={16} />
              </div>
              <div className="info-pill-text">
                <span className="pill-title">Documentos</span>
                <span className="pill-subtitle">Múltiples xlsx permitidos</span>
              </div>
            </div>

            <div className="info-pill">
              <div className="info-pill-icon">
                <FileSpreadsheet size={16} />
              </div>
              <div className="info-pill-text">
                <span className="pill-title">Tamaño</span>
                <span className="pill-subtitle">1KB - 20MB por archivo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenedor de Drag and Drop */}
        <div
          className={`dropzone-container ${dragActive ? 'drag-active' : ''} ${errorMsg ? 'has-error' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input-hidden"
            accept=".xlsx"
            onChange={handleFileChange}
            multiple
            aria-label="Subir archivos excel"
            title="Subir archivos excel"
          />

          <div className="dropzone-content">
            <div className="cloud-icon-wrapper">
              <UploadCloud size={48} className="cloud-icon" />
            </div>

            <p className="dropzone-main-text">Drag & drop to upload</p>
            <p className="dropzone-sub-text">
              Or <span className="browse-link" onClick={onButtonClick}>browse</span>
            </p>
          </div>
        </div>

        {/* Archivos seleccionados */}
        {selectedFiles.length > 0 && (
          <div className="selected-files-container">
            <h4 className="font-bold text-sm mb-sm mt-lg">Archivos seleccionados ({selectedFiles.length}):</h4>
            <div className="selected-files-list">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="selected-file-banner">
                  <FileSpreadsheet size={20} className="file-icon" />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatBytes(file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => removeFile(idx)}
                    title="Remover de la lista"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {uploading && (
          <div className="progress-container">
            <div className="progress-info">
              <span className="progress-label">Importando bases de datos...</span>
              <span className="progress-pct">{uploadProgress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Mensajes */}
        {errorMsg && (
          <div className="alert-message alert-error">
            <XCircle size={20} className="alert-icon" />
            <div className="alert-content">
              <h4 className="alert-title">Información de la carga</h4>
              <p className="alert-desc">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="alert-message alert-success">
            <CheckCircle2 size={20} className="alert-icon" />
            <div className="alert-content">
              <h4 className="alert-title">Carga completada</h4>
              <p className="alert-desc">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="upload-footer">
          <button
            className="btn btn-submit"
            disabled={selectedFiles.length === 0 || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Subiendo...
              </>
            ) : (
              'Subir'
            )}
          </button>
        </div>
      </div>



    </div>
  );
};
