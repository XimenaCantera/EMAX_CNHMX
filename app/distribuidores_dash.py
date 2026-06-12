import os
import pandas as pd
import dash
from dash import dcc, html
import plotly.graph_objects as go
from dashboard import obtener_datos_distribuidores

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'ArchivosLimpios')

def init_distribuidores_dash(server):
    # Usar la plantilla HTML para consistencia con los spinners de carga
    from plantillas_dash import PLANTILLA_HTML_CARGANDO

    # Inicializar la aplicación Dash en el servidor Flask
    app_dash = dash.Dash(
        __name__,
        server=server,
        url_base_pathname='/dash/distribuidores/bar/',
        external_stylesheets=['https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap']
    )
    app_dash.index_string = PLANTILLA_HTML_CARGANDO

    def serve_layout():
        datos = obtener_datos_distribuidores(CLEAN_FILES_DIR)
        top_dist = datos.get('top_distribuidores', [])
        
        if not top_dist:
            return html.Div([
                html.Div([
                    html.H3("Faltan archivos de datos", style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P("Por favor, ve a la sección de 'Importar datos' y sube los archivos limpios.")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '50px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

        df = pd.DataFrame(top_dist)
        
        # Paleta de tonos de rojo para colorear las barras según su importancia
        colores = [
            '#67000d', '#a50f15', '#cb181d', '#ef3b2c', '#fb6a4a',
            '#fc9272', '#fcbba1', '#fee0d2', '#fff5f0', '#ffffff'
        ]
        # Recortar la paleta de colores si hay menos datos
        colores_barras = colores[:len(df)]

        # Crear la gráfica de barras interactiva de Plotly
        fig = go.Figure(data=[
            go.Bar(
                x=df['distribuidor'],
                y=df['unidades_alerta_roja'],
                text=df['unidades_alerta_roja'],
                textposition='outside',
                marker_color=colores_barras,
                hovertemplate="<b>%{x}</b><br>Alerta Roja: %{y} unidades<br>Porcentaje: %{customdata:.1f}% del total<extra></extra>",
                customdata=df['porcentaje_alerta']
            )
        ])

        # Darle estilo y formato para que se acople perfectamente a la UI de React
        fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font_family='Outfit, sans-serif',
            font_color='#1e293b',
            margin=dict(l=40, r=40, t=30, b=100),
            height=350,
            xaxis=dict(
                tickangle=-45,
                gridcolor='#f3f4f6',
                linecolor='#e5e7eb',
                tickfont=dict(size=10),
                zeroline=False
            ),
            yaxis=dict(
                gridcolor='#f3f4f6',
                linecolor='#e5e7eb',
                tickfont=dict(size=10),
                zeroline=False
            )
        )

        return html.Div([
            dcc.Graph(figure=fig, config={'displayModeBar': False})
        ], style={'backgroundColor': 'transparent', 'font-family': 'Outfit, sans-serif'})

    app_dash.layout = serve_layout
