import os
import io
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

DIR_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_ARCHIVOS_LIMPIOS = os.path.join(DIR_BASE, 'data', 'ArchivosLimpios')

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

# Validar los documentos y estandarizar el nombre para facilitar el análisis
def clasificar_y_validar_archivo(df):
    columnas = [str(c).strip().lower() for c in df.columns]
    
    # Mantenimientos
    columnas_mantenimiento = {'servicio', 'actual', 'estatus'}
    if columnas_mantenimiento.issubset(set(columnas)):
        return 'new_mantenimientos.xlsx', 'Mantenimientos', ['ALIAS', 'SERVICIO', 'ACTUAL', 'ESTATUS', 'DISTRIBUIDOR']
        
    # Unidades
    tiene_fecha_alta = any('fecha alta' in c or 'fecha_alta' in c or 'fechaalta' in c for c in columnas)
    tiene_alias = any('alias' in c for c in columnas)
    if tiene_fecha_alta and tiene_alias:
        return 'new_unidades.xlsx', 'Unidades', ['Alias', 'Fecha Alta', 'Cerrados', 'C.Fuera', 'Pendientes', 'Horometro']
        
    # Población (Severity)
    tiene_vin = any('vin' in c or 'serie' in c for c in columnas)
    tiene_severidad = any('severity' in c for c in columnas)
    if tiene_vin and tiene_severidad:
        return 'new_population.xlsx', 'Población', ['VIN (17 CHARACTERS)', 'SEVERITY LEVEL', 'MODEL']
        
    # Horas
    tiene_dia = any('día' in c or 'dia' in c or 'date' in c for c in columnas)
    tiene_horas = any('horas' in c or 'hours' in c for c in columnas)
    tiene_imei = any('imei' in c for c in columnas)
    tiene_mensual = any(any(anio in c for anio in ['2023', '2024', '2025', '2026']) for c in columnas)
    
    if tiene_alias and (tiene_dia and tiene_horas):
        return 'new_horas.xlsx', 'Horas de Trabajo', ['ALIAS', 'DÍA', 'HORAS']
    elif tiene_alias and (tiene_imei or tiene_mensual):
        return 'new_horas.xlsx', 'Horas de Trabajo', ['Alias', 'IMEI', 'Latitud', 'Longitud']
        
    # Ruteo
    tiene_latitud = any('lat' in c for c in columnas)
    tiene_longitud = any('lon' in c or 'lng' in c for c in columnas)
    tiene_division = any('division' in c or 'división' in c for c in columnas)
    tiene_distancia = any('distancia' in c for c in columnas)
    
    if tiene_division or tiene_distancia:
        return 'new_ruteo.xlsx', 'Ruteo', ['Division', 'Distancia del Dia', 'Distancia de Ruta']
    elif tiene_latitud and tiene_longitud and tiene_alias:
        if not (tiene_imei or tiene_mensual):
            return 'new_ruteo.xlsx', 'Ruteo', ['ALIAS', 'LATITUD', 'LONGITUD', 'RUTEO']
        
    # Distribuidores
    tiene_distribuidor = any('distribuidor' in c or 'dist' in c for c in columnas)
    tiene_ciudad = any('ciudad' in c or 'city' in c for c in columnas)
    tiene_estado = any('estado' in c or 'state' in c for c in columnas)
    if tiene_distribuidor and tiene_ciudad and tiene_estado:
        return 'new_distribuidor.xlsx', 'Distribuidor', ['DISTRIBUIDOR', 'CIUDAD', 'ESTADO', 'ZONA']
        
    # Reglas de respaldo si falla lo anterior
    if any(x in columnas for x in ['servicio', 'actual', 'hrmtro']):
        return 'new_mantenimientos.xlsx', 'Mantenimientos', ['ALIAS', 'SERVICIO', 'ACTUAL', 'ESTATUS', 'DISTRIBUIDOR']
    if any(x in columnas for x in ['horometro', 'fecha alta', 'alias']) and 'pendientes' in columnas:
        return 'new_unidades.xlsx', 'Unidades', ['Alias', 'Fecha Alta', 'Cerrados', 'C.Fuera', 'Pendientes', 'Horometro']
        
    return None, None, []

@app.route('/api/status', methods=['GET'])
def obtener_estado():
    return jsonify({
        "status": "ok",
        "message": "Servidor backend de CNH Industrial activo."
    }), 200

@app.route('/api/upload', methods=['POST'])
def subir_archivos():
    archivos_subidos = request.files.getlist('files') or request.files.getlist('file')
    
    if not archivos_subidos or len(archivos_subidos) == 0 or (len(archivos_subidos) == 1 and archivos_subidos[0].filename == ''):
        return jsonify({"error": "No se recibió ningún archivo válido en la solicitud."}), 400
        
    resultados = []
    
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
            
        if not archivo.filename.lower().endswith('.xlsx'):
            resultados.append({
                "filename": archivo.filename,
                "success": False,
                "error": "Solo se permiten archivos de tipo Excel (.xlsx)."
            })
            continue
            
        try:
            bytes_archivo = archivo.read()
            df = pd.read_excel(io.BytesIO(bytes_archivo))
            
            nombre_destino, tipo_archivo, columnas_requeridas = clasificar_y_validar_archivo(df)
            
            if not nombre_destino:
                resultados.append({
                    "filename": archivo.filename,
                    "success": False,
                    "error": "El archivo no pudo ser clasificado. Asegúrese de que el documento contiene las columnas correctas."
                })
                continue
                
            os.makedirs(DIR_ARCHIVOS_LIMPIOS, exist_ok=True)
            ruta_destino = os.path.join(DIR_ARCHIVOS_LIMPIOS, nombre_destino)
            with open(ruta_destino, 'wb') as f:
                f.write(bytes_archivo)
                
            cantidad_filas = len(df)
            lista_columnas = [str(c) for c in df.columns]
            tamano_archivo = len(bytes_archivo)
            
            vista_previa_cruda = df.head(5).to_dict(orient='records')
            datos_vista_previa = [
                {str(k): sanitizar_valor(v) for k, v in fila.items()}
                for fila in vista_previa_cruda
            ]
            
            resultados.append({
                "filename": archivo.filename,
                "saved_as": nombre_destino,
                "file_type": tipo_archivo,
                "success": True,
                "message": f"¡Archivo '{archivo.filename}' detectado como '{tipo_archivo}' y guardado como '{nombre_destino}'!",
                "metadata": {
                    "filename": archivo.filename,
                    "saved_as": nombre_destino,
                    "file_type": tipo_archivo,
                    "size_bytes": tamano_archivo,
                    "rows": cantidad_filas,
                    "columns": lista_columnas,
                    "preview": datos_vista_previa
                }
            })
            
        except Exception as e:
            resultados.append({
                "filename": archivo.filename,
                "success": False,
                "error": f"Error al procesar el archivo: {str(e)}"
            })
            
    conteo_exitosos = sum(1 for r in resultados if r["success"])
    
    # Intenta limpiar cache de dashboard si la función existe
    try:
        from dashboard import limpiar_cache
        limpiar_cache()
    except Exception:
        pass
        
    return jsonify({
        "success": conteo_exitosos > 0,
        "results": resultados,
        "success_count": conteo_exitosos,
        "total_count": len(resultados)
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
