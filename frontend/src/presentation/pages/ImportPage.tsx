import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Loader2, ShieldCheck, X } from 'lucide-react';
import './ImportPage.css';

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

  const validateFiles = (files: File[] | FileList) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const validFiles: File[] = [];
    let hasInvalidExtension = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx') {
        // Evitar duplicados en la lista de seleccionados
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(Array.from(e.target.files));
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    setSuccessMsg(null);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 10;
      });
    }, 120);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file); // Usa la llave 'files' para el backend estructurado
    });

    try {
      const response = await fetch('http://127.0.0.1:5001/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok && data.success) {
        setImportedResults(data.results);

        const successCount = data.success_count;
        const totalCount = data.total_count;

        if (successCount === totalCount) {
          setSuccessMsg(`¡Se cargaron correctamente los ${totalCount} archivos!`);
        } else {
          setSuccessMsg(`Carga parcial: ${successCount} de ${totalCount} archivos se procesaron con éxito.`);
          const failures = data.results
            .filter((r: any) => !r.success)
            .map((r: any) => `${r.filename}: ${r.error}`)
            .join(', ');
          setErrorMsg(`Errores en archivos: ${failures}`);
        }

        // Buscar el índice del primer archivo exitoso para previsualizarlo
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
      setErrorMsg("No se pudo conectar con el servidor backend en http://127.0.0.1:5001. Asegúrate de iniciar el backend.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

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

      {/* Vista previa de datos por pestañas */}
      {importedResults && importedResults.length > 0 && (
        <div className="card preview-card fade-in">
          <div className="preview-results-header">
            <h3 className="card-title">Resumen de Archivos Importados</h3>
          </div>

          <div className="preview-tabs">
            {importedResults.map((res, idx) => (
              <button
                key={idx}
                type="button"
                className={`preview-tab-btn ${activePreviewIndex === idx ? 'active' : ''} ${res.success ? 'success' : 'error'}`}
                onClick={() => setActivePreviewIndex(idx)}
              >
                <FileSpreadsheet size={16} />
                <span className="tab-filename">{res.filename}</span>
                <span className={`badge ${res.success ? 'badge-success' : 'badge-critical'}`}>
                  {res.success ? 'Listo' : 'Error'}
                </span>
              </button>
            ))}
          </div>

          {importedResults[activePreviewIndex] && (
            <div className="active-preview-content">
              {importedResults[activePreviewIndex].success && importedResults[activePreviewIndex].metadata ? (
                <>
                  <div className="preview-header">
                    <div className="flex items-center gap-sm">
                      <ShieldCheck className="text-success" size={24} />
                      <div>
                        <h4 className="font-bold">{importedResults[activePreviewIndex].filename}</h4>
                        <p className="text-muted text-sm">Mostrando primeros 5 registros de datos importados</p>
                      </div>
                    </div>

                    <div className="preview-summary-pills">
                      <div className="preview-sum-pill">
                        <span className="sum-label">Registros</span>
                        <span className="sum-val">
                          {importedResults[activePreviewIndex].metadata!.rows.toLocaleString()}
                        </span>
                      </div>
                      <div className="preview-sum-pill">
                        <span className="sum-label">Columnas</span>
                        <span className="sum-val">
                          {importedResults[activePreviewIndex].metadata!.columns.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="preview-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {importedResults[activePreviewIndex].metadata!.columns.map((col: string) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importedResults[activePreviewIndex].metadata!.preview.map((row: any, rIdx: number) => (
                          <tr key={rIdx}>
                            {importedResults[activePreviewIndex].metadata!.columns.map((col: string) => (
                              <td key={col} className={typeof row[col] === 'number' ? 'font-mono' : ''}>
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : <em className="text-muted text-xs">nulo</em>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="preview-error-box">
                  <XCircle size={36} className="text-critical mb-sm" />
                  <h4 className="font-bold text-critical">Error en este archivo</h4>
                  <p className="text-muted">{importedResults[activePreviewIndex].error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
