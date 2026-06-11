import os
import sys

# Agregar el directorio actual al path de Python para permitir ejecución desde cualquier lugar
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd


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
        "message": "Servidor backend de CNH Industrial activo."
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

from dashboard import obtener_data, limpiar_cache

@app.route('/api/dashboard', methods=['GET'])
def obtener_dashboard():
    import time
    inicio_peticion = time.time()
    try:
        import dashboard
        encontro_en_cache = dashboard._CACHE_DASHBOARD is not None
        
        datos = obtener_data(CLEAN_FILES_DIR)

        fin_peticion = time.time()
        print(f"[LOG] Endpoint /api/dashboard respondido en {fin_peticion - inicio_peticion:.2f} segundos. Origen: {'Caché' if encontro_en_cache else 'Procesamiento nuevo'}")

        return jsonify({
            "success": True,
            "data": datos
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/distribuidores', methods=['GET'])
def obtener_distribuidores_api():
    try:
        from dashboard import obtener_datos_distribuidores
        datos = obtener_datos_distribuidores(CLEAN_FILES_DIR)
        
        return jsonify({
            "success": True,
            "data": datos
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/mapa', methods=['GET'])
def obtener_mapa():
    try:
        import dashboard
        if hasattr(dashboard, '_CACHE_MAPA') and dashboard._CACHE_MAPA:
            return dashboard._CACHE_MAPA, 200, {'Content-Type': 'text/html; charset=utf-8'}
        else:
            return "<html><body><p>Generando mapa... Refresque la página.</p></body></html>", 200, {'Content-Type': 'text/html; charset=utf-8'}
    except Exception as e:
        return f"<html><body><p>Error cargando mapa: {str(e)}</p></body></html>", 500

@app.route('/api/download/tabla-riesgo', methods=['GET'])
def descargar_tabla_riesgo():
    try:
        import glob
        directorio_compania = os.path.join(BASE_DIR, 'data', 'archivos_compañia')
        archivos_riesgo = glob.glob(os.path.join(directorio_compania, 'tabla_riesg*.xlsx'))
        
        if archivos_riesgo:
            ruta_archivo = archivos_riesgo[0]
            nombre_archivo = os.path.basename(ruta_archivo)
            return send_file(
                ruta_archivo, 
                as_attachment=True, 
                download_name=nombre_archivo
            )
        else:
            return jsonify({"error": "No se encontró el archivo de riesgo."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

print("Iniciando servidor Flask...")

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

# =============================================================
# Integrar Dash de Monetización
# =============================================================
from monetizacion import inicializar_monetizacion
inicializar_monetizacion(app)

if __name__ == '__main__':
    servidor_flask.run(host='0.0.0.0', port=5000, debug=True)
