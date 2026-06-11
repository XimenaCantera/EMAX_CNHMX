import os
import sys

# Agregar el directorio actual al path de Python para permitir ejecución desde cualquier lugar
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np


# Inicializar el servidor Flask principal
servidor_flask = Flask(__name__)
CORS(servidor_flask)

DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRECTORIO_ARCHIVOS_LIMPIOS = os.path.join(DIRECTORIO_BASE, 'data', 'ArchivosLimpios')

# ==============================
# Endpoints de la API REST
# ==============================

@servidor_flask.route('/api/status', methods=['GET'])
def obtener_estado_servidor():
    return jsonify({
        "status": "ok",
        "message": "Servidor backend de CNH Industrial activo con Dash."
    }), 200

# Stub de compatibilidad para dashboards
def obtener_datos_dashboard(directorio_archivos):
    return None

@servidor_flask.route('/api/dashboard', methods=['GET'])
def obtener_dashboard():
    try:
        datos = obtener_datos_dashboard(DIRECTORIO_ARCHIVOS_LIMPIOS)
        if datos is None:
            return jsonify({
                "success": False,
                "error": "No se encontraron las bases de datos de CNH necesarias o ocurrió un error al cargarlas. Por favor, sube los archivos limpios en la sección 'Importar datos'."
            }), 404
        return jsonify({
            "success": True,
            "data": datos
        }), 200
    except Exception as error_servidor:
        print(f"Error en /api/dashboard: {error_servidor}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Error interno del servidor al procesar el dashboard: {str(error_servidor)}"
        }), 500

@servidor_flask.route('/api/upload', methods=['POST'])
def subir_archivos_excel():
    archivos_cargados = request.files.getlist('files') or request.files.getlist('file')
    if not archivos_cargados or len(archivos_cargados) == 0 or (len(archivos_cargados) == 1 and archivos_cargados[0].filename == ''):
        return jsonify({"error": "No se recibió ningún archivo válido en la solicitud."}), 400
        
    resultados_procesamiento = []
    
    def sanitizar_valor_celda(valor):
        if pd.isnull(valor) or valor is None:
            return None
        if isinstance(valor, (pd.Timestamp, pd.Timedelta)):
            return str(valor)
        if isinstance(valor, float):
            if np.isnan(valor) or np.isinf(valor):
                return None
        try:
            # Converte los valores de numpy a nativos de Python
            return valor.item()
        except Exception:
            pass
        return valor

        
    for archivo in archivos_cargados:
        if archivo.filename == '':
            continue
        if not archivo.filename.lower().endswith('.xlsx'):
            resultados_procesamiento.append({
                "filename": archivo.filename,
                "success": False,
                "error": "Solo se permiten archivos de tipo Excel (.xlsx)."
            })
            continue
            
        try:
            os.makedirs(DIRECTORIO_ARCHIVOS_LIMPIOS, exist_ok=True)
            ruta_destino = os.path.join(DIRECTORIO_ARCHIVOS_LIMPIOS, archivo.filename)
            archivo.save(ruta_destino)
            
    
            df_temporal = pd.read_excel(ruta_destino)
            cantidad_filas = len(df_temporal)
            lista_columnas = list(df_temporal.columns)
            tamano_archivo = os.path.getsize(ruta_destino)
 
            vista_previa_original = df_temporal.head(5).to_dict(orient='records')
            datos_vista_previa = [
                {columna: sanitizar_valor_celda(valor) for columna, valor in fila.items()}
                for fila in vista_previa_original
            ]
            
            resultados_procesamiento.append({
                "filename": archivo.filename,
                "success": True,
                "message": f"¡Archivo '{archivo.filename}' importado y guardado correctamente!",
                "metadata": {
                    "filename": archivo.filename,
                    "size_bytes": tamano_archivo,
                    "rows": cantidad_filas,
                    "columns": lista_columnas,
                    "preview": datos_vista_previa
                }
            })
        except Exception as error_carga:
            resultados_procesamiento.append({
                "filename": archivo.filename,
                "success": False,
                "error": f"Error al procesar el archivo: {str(error_carga)}"
            })
            
    cantidad_exitosos = sum(1 for resultado in resultados_procesamiento if resultado["success"])
    return jsonify({
        "success": cantidad_exitosos > 0,
        "results": resultados_procesamiento,
        "success_count": cantidad_exitosos,
        "total_count": len(resultados_procesamiento)
    }), 200

# =============================================================
# 6.2.1 Integrar Dash de Riesgo Operativo
# =============================================================
from riesgo_operativo import init_riesgo_operativo
init_riesgo_operativo(servidor_flask)

# =============================================================
# 6.2.1 Integrar Dash de Monetización
# =============================================================
from monetizacion import inicializar_monetizacion
inicializar_monetizacion(servidor_flask)

# Aliases de compatibilidad global por si se requieren externamente
app = servidor_flask

if __name__ == '__main__':
    servidor_flask.run(host='0.0.0.0', port=5000, debug=True)
