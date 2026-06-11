import os
import sys

# Agregar el directorio actual al path de Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)

CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'archivos_limpios')

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "ok",
        "message": "Servidor backend de CNH Industrial activo."
    }), 200

@app.route('/api/upload', methods=['POST'])
def subir_archivos():
    # Soporta múltiples archivos
    archivos_subidos = request.files.getlist('files') or request.files.getlist('file')
    
    if not archivos_subidos or len(archivos_subidos) == 0 or (len(archivos_subidos) == 1 and archivos_subidos[0].filename == ''):
        return jsonify({"error": "No se recibió ningún archivo válido en la solicitud."}), 400
        
    resultados = []
    
    # Limpiar valores para evitar errores
    import numpy as np
    def sanitizar_valor(v):
        if pd.isnull(v) or v is None:
            return None
        if isinstance(v, (pd.Timestamp, pd.Timedelta)):
            return str(v)
        if isinstance(v, float):
            if np.isnan(v) or np.isinf(v):
                return None
        try:
            if hasattr(v, 'item'):
                return v.item()
        except Exception:
            pass
        return v
        
    for archivo in archivos_subidos:
        if archivo.filename == '':
            continue
            
        # Revisar la extensión del archivo
        if not archivo.filename.lower().endswith('.xlsx'):
            resultados.append({
                "filename": archivo.filename,
                "success": False,
                "error": "Solo se permiten archivos de tipo Excel (.xlsx)."
            })
            continue
            
        try:
            # Crear un directorio en caso de que no exista
            os.makedirs(CLEAN_FILES_DIR, exist_ok=True)
            
            # Guardar el archivo en la carpeta ArchivosLimpios
            ruta_destino = os.path.join(CLEAN_FILES_DIR, archivo.filename)
            archivo.save(ruta_destino)
            
            # Leemos el archivo de Excel
            dataframe_excel = pd.read_excel(ruta_destino)
            
            cantidad_filas = len(dataframe_excel)
            lista_columnas = list(dataframe_excel.columns)
            tamano_archivo = os.path.getsize(ruta_destino)
            
            # Obtenemos las primeras 5 filas para revisar
            vista_previa_cruda = dataframe_excel.head(5).to_dict(orient='records')
            
            vista_previa_datos = [
                {k: sanitizar_valor(v) for k, v in row.items()}
                for row in vista_previa_cruda
            ]
            
            resultados.append({
                "filename": archivo.filename,
                "success": True,
                "message": f"¡Archivo '{archivo.filename}' importado y guardado correctamente!",
                "metadata": {
                    "filename": archivo.filename,
                    "size_bytes": tamano_archivo,
                    "rows": cantidad_filas,
                    "columns": lista_columnas,
                    "preview": vista_previa_datos
                }
            })
            
        except Exception as e:
            resultados.append({
                "filename": archivo.filename,
                "success": False,
                "error": f"Error al procesar el archivo: {str(e)}"
            })
            
    conteo_exitosos = sum(1 for r in resultados if r["success"])
    
    if conteo_exitosos > 0:
        limpiar_cache()
    
    return jsonify({
        "success": conteo_exitosos > 0,
        "results": resultados,
        "success_count": conteo_exitosos,
        "total_count": len(resultados)
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
# Integrar Dash de Riesgo Operativo
# =============================================================
from riesgo_operativo import init_riesgo_operativo
init_riesgo_operativo(app)

# =============================================================
# Integrar Dash de Monetización
# =============================================================
from monetizacion import inicializar_monetizacion
inicializar_monetizacion(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)