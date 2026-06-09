import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)

CORS(app)


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'ArchivosLimpios')

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "ok",
        "message": "Servidor backend de CNH Industrial activo."
    }), 200

@app.route('/api/upload', methods=['POST'])
def upload_files():
    # Soporta múltiples archivos
    uploaded_files = request.files.getlist('files') or request.files.getlist('file')
    
    if not uploaded_files or len(uploaded_files) == 0 or (len(uploaded_files) == 1 and uploaded_files[0].filename == ''):
        return jsonify({"error": "No se recibió ningún archivo válido en la solicitud."}), 400
        
    results = []
    
    # Sanitizar valores para evitar errores
    import numpy as np
    def sanitize_val(v):
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
        
    for file in uploaded_files:
        if file.filename == '':
            continue
            
        # Revisar la extensión del archivo
        if not file.filename.lower().endswith('.xlsx'):
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "Solo se permiten archivos de tipo Excel (.xlsx)."
            })
            continue
            
        try:
            # Crear un directorio en caso de que no exista
            os.makedirs(CLEAN_FILES_DIR, exist_ok=True)
            
            # Guardar el archivo en la carpeta ArchivosLimpios
            target_path = os.path.join(CLEAN_FILES_DIR, file.filename)
            file.save(target_path)
            
            # Leemos el archivo de Excel
            df = pd.read_excel(target_path)
            
            rows_count = len(df)
            columns_list = list(df.columns)
            file_size = os.path.getsize(target_path)
            
            # Obtenemos las primeras 5 filas para revisar
            preview_raw = df.head(5).to_dict(orient='records')
            
            preview_data = [
                {k: sanitize_val(v) for k, v in row.items()}
                for row in preview_raw
            ]
            
            results.append({
                "filename": file.filename,
                "success": True,
                "message": f"¡Archivo '{file.filename}' importado y guardado correctamente!",
                "metadata": {
                    "filename": file.filename,
                    "size_bytes": file_size,
                    "rows": rows_count,
                    "columns": columns_list,
                    "preview": preview_data
                }
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": f"Error al procesar el archivo: {str(e)}"
            })
            
    success_count = sum(1 for r in results if r["success"])
    
    return jsonify({
        "success": success_count > 0,
        "results": results,
        "success_count": success_count,
        "total_count": len(results)
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
