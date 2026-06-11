import os
import sys

# Agregar el directorio actual al path de Python para permitir ejecución desde cualquier lugar
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np

# Inicializar el servidor Flask principal
servidor_flask = Flask(__name__)
CORS(servidor_flask)
app = servidor_flask

DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRECTORIO_ARCHIVOS_LIMPIOS = os.path.join(DIRECTORIO_BASE, 'data', 'ArchivosLimpios')

# Importar funciones reales del dashboard
from dashboard import obtener_data, limpiar_cache


if not hasattr(Flask, 'before_first_request'):
    def before_first_request(self, f):
        ya_corrio = False
        def wrapper(*args, **kwargs):
            nonlocal ya_corrio
            if not ya_corrio:
                ya_corrio = True
                f(*args, **kwargs)
        self.before_request(wrapper)
        return f
    Flask.before_first_request = before_first_request

# ==============================
# Endpoints de la API REST
# ==============================

@app.route('/api/status', methods=['GET'])
def obtener_estado_servidor():
    return jsonify({
        "status": "ok",
        "message": "Servidor backend de CNH Industrial activo con Dash."
    }), 200


@app.route('/api/dashboard', methods=['GET'])
def obtener_dashboard():
    import time
    inicio_peticion = time.time()
    try:
        import dashboard
        encontro_en_cache = dashboard._CACHE_DASHBOARD is not None
        
        datos = obtener_data(DIRECTORIO_ARCHIVOS_LIMPIOS)

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
        datos = obtener_datos_distribuidores(DIRECTORIO_ARCHIVOS_LIMPIOS)
        
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
        directorio_compania = os.path.join(DIRECTORIO_BASE, 'data', 'archivos_compañia')
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

# =============================================================
# 6.2.1 Integrar Dash de Riesgo Operativo
# =============================================================
from riesgo_operativo import init_riesgo_operativo
init_riesgo_operativo(app)

# =============================================================
# 6.2.1 Integrar Dash de Monetización
# =============================================================
from monetizacion import inicializar_monetizacion
inicializar_monetizacion(app)

# =============================================================
# Integrar Dash e API de Fuga de Servicios
# =============================================================
from fuga_servicios import init_fuga_servicios
init_fuga_servicios(app)

# =============================================================
# Integrar Importar Datos
# =============================================================
from importador import init_importador
init_importador(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
