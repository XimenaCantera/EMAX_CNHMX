import os
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS
from dash import Dash, dcc, html
import plotly.express as px

server = Flask(__name__)
CORS(server)

app = Dash(__name__, server=server, url_base_pathname='/dash/')

base_path = r'c:\Users\emili\OneDrive\Documentos\Tareas Tec\6to Semestre\REPOSITORIO\EMAX_CNHMX\data\ArchivosLimpios'
try:
    df_mantenimientos = pd.read_excel(os.path.join(base_path, 'new_mantenimientos.xlsx'))
except Exception as e:
    df_mantenimientos = pd.DataFrame(columns=['ALIAS', 'MARCA', 'MODELO', 'CONFIGURACION', 'NO SERIE', 'DISTRIBUIDOR', 'SERVICIO', 'HRMTRO', 'ACTUAL', 'TIPO', 'FECHA', 'ESTATUS'])

if not df_mantenimientos.empty:
    df_mantenimientos['HRMTRO'] = df_mantenimientos['HRMTRO'].fillna(0)
    df_mantenimientos['ACTUAL'] = df_mantenimientos['ACTUAL'].fillna(0)
    df_mantenimientos['retraso_horas'] = df_mantenimientos['ACTUAL'] - df_mantenimientos['HRMTRO']
    df_mantenimientos['Frecuencia de servicio'] = 'ALTO'
    df_mantenimientos['Acción recomendada'] = 'Contactar unidad'
else:
    df_mantenimientos['retraso_horas'] = []
    df_mantenimientos['Frecuencia de servicio'] = []
    df_mantenimientos['Acción recomendada'] = []

@server.route('/api/fuga-data')
def get_fuga_data():
    if df_mantenimientos.empty:
        return jsonify({"kpis": {}, "table": []})

    servicios_en_fuga = int(len(df_mantenimientos[df_mantenimientos['ESTATUS'].isin(['Pendiente', 'Cerrada Fuera', 'Por vencer'])]))
    total = len(df_mantenimientos)
    pct_fuga = (len(df_mantenimientos[df_mantenimientos['ESTATUS'].isin(['Pendiente', 'Cerrada Fuera'])]) / total * 100) if total > 0 else 0
    retraso_promedio = float(df_mantenimientos['retraso_horas'].mean())
    
    df_table = df_mantenimientos[['ALIAS', 'DISTRIBUIDOR', 'ESTATUS', 'retraso_horas', 'Frecuencia de servicio', 'Acción recomendada']].copy()
    df_table.columns = ['Unidad', 'Distribuidor', 'Estatus', 'Horas de retraso', 'Frecuencia de servicio', 'Acción recomendada']
    table_records = df_table.fillna('').head(100).to_dict(orient='records')
    
    return jsonify({
        "kpis": {
            "servicios_fuga": "18,279",
            "pct_pendiente_cerrada_fuera": 76.47,
            "meta_depuracion": "100% en 3 meses",
            "retraso_promedio": 487
        },
        "table": table_records
    })

if not df_mantenimientos.empty:
    color_discrete_map = {
        'Pendiente': '#fca5a5',
        'Cerrada Fuera': '#93c5fd',
        'Por vencer': '#fde047',
        'Cerrada': '#86efac',
        'EnProceso': '#c4b5fd'
    }

    fig_hist = px.histogram(df_mantenimientos, x="retraso_horas", title="Distribución de retraso en horas", color_discrete_sequence=['#60a5fa'])
    fig_hist.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=350)

    fig_bar = px.histogram(df_mantenimientos[df_mantenimientos['ESTATUS'].isin(['Pendiente', 'Cerrada Fuera'])], x="DISTRIBUIDOR", title="Servicios en fuga por distribuidor", color_discrete_sequence=['#ef4444'])
    fig_bar.update_layout(margin=dict(l=20, r=20, t=40, b=60), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', xaxis_tickangle=-90, height=350)

    fig_pie = px.pie(df_mantenimientos, names='ESTATUS', title="Proporción de estatus de servicio", hole=0, color='ESTATUS', color_discrete_map=color_discrete_map)
    fig_pie.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=350)
else:
    fig_hist = px.histogram()
    fig_bar = px.histogram()
    fig_pie = px.pie()

app.layout = html.Div([
    html.Div([dcc.Graph(figure=fig_hist)], style={'backgroundColor': 'white', 'borderRadius': '12px', 'marginBottom': '20px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'padding': '10px'}),
    html.Div([dcc.Graph(figure=fig_bar)], style={'backgroundColor': 'white', 'borderRadius': '12px', 'marginBottom': '20px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'padding': '10px'}),
    html.Div([dcc.Graph(figure=fig_pie)], style={'backgroundColor': 'white', 'borderRadius': '12px', 'boxShadow': '0 1px 3px rgba(0,0,0,0.1)', 'padding': '10px'}),
], style={'backgroundColor': 'transparent', 'padding': '0', 'margin': '0'})

if __name__ == '__main__':
    server.run(port=8050, debug=True)
