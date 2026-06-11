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
def clasificar_y_validar_archivo(df, nombre_archivo):
    nombre_lc = nombre_archivo.lower()
    columnas = [str(c).strip().lower() for c in df.columns]
    
    # Mantenimientos
    if 'mantenimiento' in nombre_lc:
        columnas_req = ['alias', 'servicio', 'actual', 'estatus', 'distribuidor']
        if all(col in columnas for col in columnas_req):
            return 'new_mantenimientos.xlsx', 'Mantenimientos', ['ALIAS', 'SERVICIO', 'ACTUAL', 'ESTATUS', 'DISTRIBUIDOR'], True
        # Soporte de respaldo por si alguna columna faltara
        elif any(col in columnas for col in ['servicio', 'actual', 'hrmtro']):
            return 'new_mantenimientos.xlsx', 'Mantenimientos', ['ALIAS', 'SERVICIO', 'ACTUAL', 'ESTATUS', 'DISTRIBUIDOR'], True
        return 'new_mantenimientos.xlsx', 'Mantenimientos', ['ALIAS', 'SERVICIO', 'ACTUAL', 'ESTATUS', 'DISTRIBUIDOR'], False
        
    # Unidades
    if 'unidad' in nombre_lc:
        tiene_fecha_alta = ('fecha alta' in columnas) or ('fecha_alta' in columnas) or ('fechaalta' in columnas)
        tiene_c_fuera = ('c.fuera' in columnas) or ('c_fuera' in columnas)
        columnas_base = ['alias', 'cerrados', 'pendientes', 'horometro']
        
        if all(col in columnas for col in columnas_base) and tiene_fecha_alta and tiene_c_fuera:
            return 'new_unidades.xlsx', 'Unidades', ['Alias', 'Fecha Alta', 'Cerrados', 'C.Fuera', 'Pendientes', 'Horometro'], True
        return 'new_unidades.xlsx', 'Unidades', ['Alias', 'Fecha Alta', 'Cerrados', 'C.Fuera', 'Pendientes', 'Horometro'], False
        
    # Población (Severity)
    if 'population' in nombre_lc or 'poblacion' in nombre_lc or 'población' in nombre_lc:
        tiene_vin = ('vin (17 characters)' in columnas) or ('vin' in columnas) or ('no serie' in columnas) or ('no. serie' in columnas)
        tiene_severity = ('severity level' in columnas) or ('severity' in columnas) or ('nivel severidad' in columnas)
        tiene_model = ('model' in columnas) or ('modelo' in columnas)
        
        if tiene_vin and tiene_severity and tiene_model:
            return 'new_population.xlsx', 'Población', ['VIN (17 CHARACTERS)', 'SEVERITY LEVEL', 'MODEL'], True
        return 'new_population.xlsx', 'Población', ['VIN (17 CHARACTERS)', 'SEVERITY LEVEL', 'MODEL'], False
        
    # Horas
    if 'hora' in nombre_lc:
        tiene_alias = 'alias' in columnas
        tiene_dia = ('dia' in columnas) or ('día' in columnas) or ('date' in columnas)
        tiene_horas_col = ('horas' in columnas) or ('hours' in columnas)
        tiene_imei = 'imei' in columnas
        tiene_mensual = any('-' in col and (col.startswith('20') or col.startswith('19')) for col in columnas)
        
        if tiene_alias and tiene_dia and tiene_horas_col:
            return 'new_horas.xlsx', 'Horas de Trabajo', ['ALIAS', 'DÍA', 'HORAS'], True
        elif tiene_alias and (tiene_imei or tiene_mensual):
            return 'new_horas.xlsx', 'Horas de Trabajo', ['Alias', 'IMEI', 'Latitud', 'Longitud'], True
        return 'new_horas.xlsx', 'Horas de Trabajo', ['Alias', 'IMEI', 'Latitud', 'Longitud'], False
        
    # Ruteo
    if 'ruteo' in nombre_lc:
        tiene_lat = ('latitud' in columnas) or ('lat' in columnas)
        tiene_lon = ('longitud' in columnas) or ('lon' in columnas) or ('lng' in columnas)
        tiene_alias = 'alias' in columnas
        tiene_division = ('division' in columnas) or ('división' in columnas)
        tiene_dist_dia = ('distancia del dia' in columnas) or ('distancia_del_dia' in columnas) or ('distancia' in columnas)
        tiene_dist_ruta = ('distancia de ruta' in columnas) or ('distancia_de_ruta' in columnas)
        
        if tiene_division and tiene_dist_dia and tiene_dist_ruta:
            return 'new_ruteo.xlsx', 'Ruteo', ['Division', 'Distancia del Dia', 'Distancia de Ruta'], True
        elif tiene_lat and tiene_lon and tiene_alias:
            return 'new_ruteo.xlsx', 'Ruteo', ['ALIAS', 'LATITUD', 'LONGITUD'], True
        return 'new_ruteo.xlsx', 'Ruteo', ['Division', 'Distancia del Dia', 'Distancia de Ruta'], False
        
    # Distribuidores
    if 'distribuidor' in nombre_lc:
        columnas_base = ['distribuidor', 'ciudad', 'estado']
        if all(col in columnas for col in columnas_base):
            return 'new_distribuidor.xlsx', 'Distribuidor', ['DISTRIBUIDOR', 'CIUDAD', 'ESTADO', 'ZONA'], True
        return 'new_distribuidor.xlsx', 'Distribuidor', ['DISTRIBUIDOR', 'CIUDAD', 'ESTADO', 'ZONA'], False
        
    return None, None, [], False

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
            
            nombre_destino, tipo_archivo, columnas_requeridas, columnas_validas = clasificar_y_validar_archivo(df, archivo.filename)
            
            if not nombre_destino:
                resultados.append({
                    "filename": archivo.filename,
                    "success": False,
                    "error": "Error de nombre: El nombre del archivo no es reconocido. Asegúrate de incluir el tipo en el nombre (ej. 'mantenimientos.xlsx', 'horas.xlsx', 'ruteo.xlsx', etc.) para que el sistema sepa qué base de datos es."
                })
                continue
                
            if not columnas_validas:
                resultados.append({
                    "filename": archivo.filename,
                    "success": False,
                    "error": f"Error de contenido (Excel incorrecto): El archivo '{archivo.filename}' se identificó como '{tipo_archivo}', pero no contiene las columnas necesarias. Asegúrate de haber subido el excel correcto. Columnas requeridas: {', '.join(columnas_requeridas)}"
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
