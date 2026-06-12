import os
import pandas as pd
import dash
from dash import dcc, html
import plotly.graph_objects as go
from dashboard import obtener_data

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'ArchivosLimpios')

def init_dashboard_dash(server):
    from plantillas_dash import PLANTILLA_HTML_CARGANDO

    app_dash = dash.Dash(
        __name__,
        server=server,
        url_base_pathname='/dash/dashboard/donut/',
        external_stylesheets=['https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap']
    )
    app_dash.index_string = PLANTILLA_HTML_CARGANDO

    def serve_layout():
        try:
            datos = obtener_data(CLEAN_FILES_DIR)
        except Exception:
            datos = {}
            
        donut_data = datos.get('donut_chart_data', {})
        
        if not donut_data:
            return html.Div([
                html.Div([
                    html.H3("Faltan archivos de datos", style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P("Por favor, ve a la sección de 'Importar datos' y sube los archivos limpios.")
                ], style={
                    'padding': '20px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '500px', 'margin': '30px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'padding': '10px'})

        labels = ['Crítico', 'Alto', 'Medio', 'Bajo']
        values = [
            donut_data.get('critico_cnt', 0),
            donut_data.get('alto_cnt', 0),
            donut_data.get('medio_cnt', 0),
            donut_data.get('bajo_cnt', 0)
        ]
        
        # Colores personalizados que combinan con el frontend
        colors = ['#A32428', '#B45309', '#20235C', '#E5E7EB']

        fig = go.Figure(data=[
            go.Pie(
                labels=labels,
                values=values,
                hole=.6,
                marker=dict(colors=colors, line=dict(color='#ffffff', width=2)),
                hoverinfo='label+value+percent',
                textinfo='percent',
                textfont=dict(size=12, family='Outfit, sans-serif', color=['#ffffff', '#ffffff', '#ffffff', '#1e293b']),
                hovertemplate="<b>%{label}</b><br>Unidades: %{value}<br>Porcentaje: %{percent}<extra></extra>"
            )
        ])

        fig.update_layout(
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=-0.2,
                xanchor="center",
                x=0.5,
                font=dict(family="Outfit, sans-serif", size=11, color="#4b5563")
            ),
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font_family='Outfit, sans-serif',
            margin=dict(l=20, r=20, t=10, b=40),
            height=280
        )

        return html.Div([
            dcc.Graph(figure=fig, config={'displayModeBar': False})
        ], style={'backgroundColor': 'transparent', 'font-family': 'Outfit, sans-serif'})

    app_dash.layout = serve_layout
