import os
import time
import pandas as pd
import numpy as np
import dash
from dash import dcc, html
import plotly.express as px
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'ArchivosLimpios')

# Guardar en caché para no procesar cada vez
_cache_riesgo = {
    'mtime': None,         
    'maint_df': None,   
    'red_alert_summary': None,
    'red_alert_summary_sorted': None,
    'top_10_oldest_alerts': None,
    'df_alerts_detail': None,
    'fig_risk_matrix': None,
    'fig_oldest_alerts': None,
    'unidades_criticas': None,
    'registros_criticos': None,
    'kmeans_model': None,
    'scaler': None,
    'dist_cluster_df': None,
}

def _cargar_y_procesar_datos(maint_path):
    """Carga y procesa todos los datos, devuelve un dict con los resultados."""
    inicio = time.time()
    print(f"[RIESGO] Procesando datos desde {maint_path}...")

    maint_csv = maint_path.replace(".xlsx", ".csv")
    if os.path.exists(maint_csv):
        maint_df = pd.read_csv(maint_csv)
        if 'FECHA' in maint_df.columns:
            maint_df['FECHA'] = pd.to_datetime(maint_df['FECHA'], errors='coerce')
    else:
        maint_df = pd.read_excel(maint_path)

    # Procesar los datos
    maint_df['delay_vs_service_interval'] = maint_df['ACTUAL'] - maint_df['SERVICIO']
    status_risk_mapping = {'Cerrada': 0, 'PorVencer': 1, 'EnProceso': 1, 'Abierta': 1, 'Pendiente': 2, 'CerradaFuera': 2}
    maint_df['overdue_risk'] = maint_df['ESTATUS'].map(status_risk_mapping).fillna(0)

    # Filtrar por estatus
    relevant_status = ['Pendiente', 'Cerrado', 'CerradaFuera']
    df_filtered_anova = maint_df[maint_df['ESTATUS'].isin(relevant_status)].copy()
    df_filtered_anova = df_filtered_anova.dropna(subset=['ACTUAL', 'HRMTRO', 'SERVICIO', 'ESTATUS'])

    df_filtered_anova['score_operativo'] = (
        df_filtered_anova['ACTUAL'] +
        df_filtered_anova['HRMTRO'] +
        df_filtered_anova['SERVICIO']
    ) / 3

    df_filtered_anova['SEVERITY_LEVEL'] = pd.qcut(
        df_filtered_anova['score_operativo'],
        q=3,
        labels=['Low', 'Medium', 'High'],
        duplicates='drop'
    )

    red_alert_units = df_filtered_anova[
        (df_filtered_anova['ESTATUS'].isin(['Pendiente', 'CerradaFuera'])) &
        (df_filtered_anova['overdue_risk'] == 2.0) &
        (df_filtered_anova['SEVERITY_LEVEL'] == 'High')
    ]

    # Métricas principales
    unidades_criticas = red_alert_units['ALIAS'].nunique()
    registros_criticos = len(red_alert_units)

    # Agrupar por distribuidor
    red_alert_units_per_dist = red_alert_units.groupby('DISTRIBUIDOR')['ALIAS'].nunique().reset_index()
    red_alert_units_per_dist.rename(columns={'ALIAS': 'Unidades en Alerta Roja'}, inplace=True)

    total_units_per_dist = maint_df.groupby('DISTRIBUIDOR')['ALIAS'].nunique().reset_index()
    total_units_per_dist.rename(columns={'ALIAS': 'Total Unidades'}, inplace=True)

    red_alert_summary = pd.merge(red_alert_units_per_dist, total_units_per_dist, on='DISTRIBUIDOR', how='left')
    red_alert_summary['Porcentaje en Alerta Roja'] = (red_alert_summary['Unidades en Alerta Roja'] / red_alert_summary['Total Unidades']) * 100
    red_alert_summary_sorted = red_alert_summary.sort_values(by='Unidades en Alerta Roja', ascending=False)

    # Gráfica de burbujas
    fig_risk_matrix = px.scatter(
        red_alert_summary,
        x='Porcentaje en Alerta Roja',
        y='Unidades en Alerta Roja',
        size='Total Unidades',
        color='DISTRIBUIDOR',
        color_discrete_sequence=['#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2'],
        hover_name='DISTRIBUIDOR',
        title='Matriz de riesgo por distribuidor',
        labels={
            'Porcentaje en Alerta Roja': 'Porcentaje de Unidades en Alerta Roja',
            'Unidades en Alerta Roja': 'Número de Unidades en Alerta Roja'
        },
        size_max=60
    )
    fig_risk_matrix.update_layout(
        plot_bgcolor='rgba(0,0,0,0)', paper_bgcolor='rgba(0,0,0,0)',
        font_family='Outfit, sans-serif', font_color='#1e293b',
        title_font_size=18, title_font_color='#0f172a', title_font_family='Outfit, sans-serif',
        margin=dict(l=40, r=40, t=60, b=40),
        xaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
        yaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
        showlegend=False, height=350
    )

    # Las 10 unidades más críticas por antigüedad
    df_alerts = maint_df[maint_df['ESTATUS'].isin(['Pendiente', 'CerradaFuera'])].copy()
    df_alerts['FECHA'] = pd.to_datetime(df_alerts['FECHA'], errors='coerce')
    df_alerts.dropna(subset=['FECHA'], inplace=True)

    current_date = pd.to_datetime('2026-06-08')
    df_alerts['antiguedad_alerta'] = (current_date - df_alerts['FECHA']).dt.days
    oldest_alerts_per_unit = df_alerts.groupby('ALIAS')['antiguedad_alerta'].min().reset_index()
    oldest_alerts_per_unit = pd.merge(oldest_alerts_per_unit, df_alerts[['ALIAS', 'ESTATUS']].drop_duplicates(), on='ALIAS', how='left')
    top_10_oldest_alerts = oldest_alerts_per_unit.sort_values(by='antiguedad_alerta', ascending=False).head(10)

    # Detalle de alertas por unidad
    df_alerts_detail = df_alerts.sort_values(by='antiguedad_alerta', ascending=False).drop_duplicates(subset=['ALIAS']).head(6)
    df_alerts_detail['FECHA_str'] = df_alerts_detail['FECHA'].dt.strftime('%Y-%m-%d')

    fig_oldest_alerts = px.bar(
        top_10_oldest_alerts,
        x='ALIAS', y='antiguedad_alerta',
        title='Top 10 unidades críticas por antigüedad de alerta',
        labels={'antiguedad_alerta': 'Antigüedad de la Alerta (Días)', 'ALIAS': 'Unidad ALIAS'},
        color='antiguedad_alerta', color_continuous_scale='Reds_r'
    )
    fig_oldest_alerts.update_xaxes(categoryorder='total descending')
    fig_oldest_alerts.update_layout(
        plot_bgcolor='rgba(0,0,0,0)', paper_bgcolor='rgba(0,0,0,0)',
        font_family='Outfit, sans-serif', font_color='#1e293b',
        title_font_size=18, title_font_color='#0f172a', title_font_family='Outfit, sans-serif',
        margin=dict(l=40, r=40, t=60, b=40),
        xaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
        yaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
        coloraxis_showscale=False, height=500
    )

    # Clasificación con K-Means
    features_kmeans = ['delay_vs_service_interval', 'overdue_risk']
    X_kmeans = maint_df[features_kmeans].dropna().copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_kmeans)

    OPTIMAL_K = 3
    kmeans_model = KMeans(n_clusters=OPTIMAL_K, init='k-means++', random_state=42, n_init=10)
    X_kmeans['cluster'] = kmeans_model.fit_predict(X_scaled)

    cluster_labels = {0: 'Riesgo Bajo', 1: 'Riesgo Medio', 2: 'Riesgo Alto'}
    X_kmeans['Segmento'] = X_kmeans['cluster'].map(cluster_labels)

    maint_with_cluster = maint_df.copy()
    maint_with_cluster = maint_with_cluster[
        maint_with_cluster[features_kmeans].notna().all(axis=1)
    ].copy()
    maint_with_cluster['cluster'] = kmeans_model.predict(
        scaler.transform(maint_with_cluster[features_kmeans])
    )
    maint_with_cluster['Segmento'] = maint_with_cluster['cluster'].map(cluster_labels)

    dist_cluster_df = (
        maint_with_cluster.groupby(['DISTRIBUIDOR', 'Segmento'])['ALIAS']
        .nunique()
        .unstack(fill_value=0)
        .reset_index()
    )
    for seg in cluster_labels.values():
        if seg not in dist_cluster_df.columns:
            dist_cluster_df[seg] = 0

    dist_cluster_df['Total'] = (
        dist_cluster_df['Riesgo Bajo'] +
        dist_cluster_df['Riesgo Medio'] +
        dist_cluster_df['Riesgo Alto']
    )
    dist_cluster_df = dist_cluster_df.sort_values('Riesgo Alto', ascending=False)

    fin = time.time()
    print(f"[RIESGO] Datos procesados en {fin - inicio:.2f} segundos. Cacheando resultados...")

    return {
        'maint_df': maint_df,
        'red_alert_summary': red_alert_summary,
        'red_alert_summary_sorted': red_alert_summary_sorted,
        'top_10_oldest_alerts': top_10_oldest_alerts,
        'df_alerts_detail': df_alerts_detail,
        'fig_risk_matrix': fig_risk_matrix,
        'fig_oldest_alerts': fig_oldest_alerts,
        'unidades_criticas': unidades_criticas,
        'registros_criticos': registros_criticos,
        'kmeans_model': kmeans_model,
        'scaler': scaler,
        'dist_cluster_df': dist_cluster_df,
    }

def _obtener_datos_cacheados(maint_path):
    """Devuelve los datos cacheados si el archivo no ha cambiado, sino reprocesa."""
    global _cache_riesgo
    maint_csv = maint_path.replace(".xlsx", ".csv")
    active_path = maint_csv if os.path.exists(maint_csv) else maint_path
    current_mtime = os.path.getmtime(active_path)

    if _cache_riesgo['mtime'] == current_mtime and _cache_riesgo['maint_df'] is not None:
        print("[RIESGO] Sirviendo desde caché (instantáneo)")
        return _cache_riesgo

    # Procesar y guardar en caché
    resultado = _cargar_y_procesar_datos(maint_path)
    resultado['mtime'] = current_mtime
    _cache_riesgo = resultado
    return _cache_riesgo


def init_riesgo_operativo(server):
    # Iniciar Dash en Flask
    app_dash = dash.Dash(
        __name__,
        server=server,
        url_base_pathname='/dash/riesgo/',
        external_stylesheets=['https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap']
    )
    
    from plantillas_dash import PLANTILLA_HTML_CARGANDO
    app_dash.index_string = PLANTILLA_HTML_CARGANDO

    from plantillas_dash import PLANTILLA_HTML_CARGANDO
    app_dash.index_string = PLANTILLA_HTML_CARGANDO

    def serve_layout():
        maint_path = os.path.join(CLEAN_FILES_DIR, 'new_mantenimientos.xlsx')
        maint_csv = os.path.join(CLEAN_FILES_DIR, 'new_mantenimientos.csv')
        
        if not os.path.exists(maint_path) and not os.path.exists(maint_csv):
            return html.Div([
                html.Div([
                    # Mensaje por si no hay datos
                    html.H3("Faltan archivos de datos", 
                        style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P("Por favor, ve a la sección de 'Importar datos' y sube el archivo limpio de mantenimientos.")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

        try:
            # Usar caché si el archivo no ha cambiado
            datos = _obtener_datos_cacheados(maint_path)
            maint_df = datos['maint_df']
            dist_cluster_df = datos['dist_cluster_df']
            unidades_criticas = datos['unidades_criticas']
            registros_criticos = datos['registros_criticos']
            df_alerts_detail = datos['df_alerts_detail']
            fig_risk_matrix = datos['fig_risk_matrix']
            fig_oldest_alerts = datos['fig_oldest_alerts']
            
            # Tabla de las 6 alertas más viejas
            table_header = [
                html.Tr([
                    html.Th("Unidad", style={'text-align': 'left', 'padding': '12px 8px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'}),
                    html.Th("Distribuidor", style={'text-align': 'left', 'padding': '12px 8px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'}),
                    html.Th("Fecha Alerta", style={'text-align': 'center', 'padding': '12px 8px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'}),
                    html.Th("Antigüedad Alerta", style={'text-align': 'right', 'padding': '12px 8px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'}),
                    html.Th("Estatus", style={'text-align': 'center', 'padding': '12px 8px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'})
                ], style={'background-color': '#f8fafc'})
            ]
            
            table_rows = []
            for idx, row in df_alerts_detail.iterrows():
                table_rows.append(html.Tr([
                    html.Td(row['ALIAS'], style={'padding': '12px 8px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '500', 'color': '#1e293b', 'font-size': '12px'}),
                    html.Td(row['DISTRIBUIDOR'], style={'padding': '12px 8px', 'border-bottom': '1px solid #f1f5f9', 'color': '#334155', 'font-size': '12px'}),
                    html.Td(row['FECHA_str'], style={'text-align': 'center', 'padding': '12px 8px', 'border-bottom': '1px solid #f1f5f9', 'color': '#334155', 'font-size': '12px'}),
                    html.Td(f"{int(row['antiguedad_alerta'])} días", style={'text-align': 'right', 'padding': '12px 8px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '600', 'color': '#b91c1c', 'font-size': '12px'}),
                    html.Td(
                        html.Span(row['ESTATUS'], style={
                            'padding': '2px 8px', 'border-radius': '9999px', 'font-size': '11px', 'font-weight': '500',
                            'background-color': '#fef2f2' if row['ESTATUS'] == 'Pendiente' else '#eff6ff',
                            'color': '#ef4444' if row['ESTATUS'] == 'Pendiente' else '#3b82f6'
                        }),
                        style={'text-align': 'center', 'padding': '12px 8px', 'border-bottom': '1px solid #f1f5f9'}
                    )
                ]))
                
            table_body = [html.Tbody(table_rows)]
 
 
 
            cluster_table_header = [
                html.Tr([
                    html.Th('Distribuidor', 
                        style={
                            'text-align': 'left', 'padding': '10px 8px', 'font-weight': '600', 
                            'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'
                            }),
                    html.Th('Riesgo Bajo', 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 'font-weight': '600',
                            'color': '#20235C', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'
                            }),
                    html.Th('Riesgo Medio', 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 'font-weight': '600', 
                            'color': '#B45309', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'
                            }),
                    html.Th('Riesgo Alto', 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 'font-weight': '600', 
                            'color': '#A32428', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'
                            }),
                    html.Th('Total Unidades', 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 'font-weight': '600', 
                            'color': '#475569', 'border-bottom': '1px solid #e2e8f0', 'font-size': '13px'
                            })
                ], style={'background-color': '#f8fafc'})
            ]

            cluster_table_rows = []
            for _, row in dist_cluster_df.head(8).iterrows():
                alto = int(row['Riesgo Alto'])
                highlight = '#fff5f5' if alto > 5 else 'transparent'
                cluster_table_rows.append(html.Tr([
                    html.Td(row['DISTRIBUIDOR'], 
                        style={
                            'padding': '10px 8px', 'border-bottom': '1px solid #f1f5f9', 
                            'font-weight': '500', 'color': '#1e293b', 'font-size': '12px'
                            }),
                    html.Td(str(int(row['Riesgo Bajo'])), 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 
                            'border-bottom': '1px solid #f1f5f9', 'color': '#20235C', 'font-size': '12px'
                            }),
                    html.Td(str(int(row['Riesgo Medio'])), 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 
                            'border-bottom': '1px solid #f1f5f9', 'color': '#B45309', 'font-size': '12px'
                            }),
                    html.Td(str(alto), 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 
                            'border-bottom': '1px solid #f1f5f9', 
                            'font-weight': '700', 'color': '#A32428', 
                            'background-color': highlight, 'font-size': '12px'
                            }),
                    html.Td(str(int(row['Total'])), 
                        style={
                            'text-align': 'right', 'padding': '10px 8px', 
                            'border-bottom': '1px solid #f1f5f9', 'color': '#334155', 'font-size': '12px'
                            })
                ]))

            cluster_table_body = [html.Tbody(cluster_table_rows)]

            # Diseño del Dashboard
            return html.Div([
                # Fila de KPIs
                html.Div([
                    # KPI 1: Unidades Críticas
                    html.Div([
                        html.Div([
                            html.Div([
                                html.Span("Unidades críticas", 
                                    style={
                                        'font-size': '14px', 
                                        'font-weight': '600', 
                                        'color': '#64748b', 
                                        'text-transform': 'none'
                                        }),
                                html.H2(f"{unidades_criticas}", 
                                    style={
                                        'font-size': '2.25rem', 
                                        'font-weight': '700', 
                                        'color': '#1e293b', 
                                        'margin': '8px 0 0 0'
                                        })
                            ], style={
                                'flex-grow': '1'
                                }),
                            # Icono de advertencia
                            html.Div([
                                html.Img(src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', style={'width': '24px', 'height': '24px'})
                            ], style={'display': 'flex', 'align-items': 'center', 'justify-content': 'center', 'background-color': '#fef2f2', 'padding': '12px', 'border-radius': '8px'})
                        ], style={'display': 'flex', 'align-items': 'center'}),
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '20px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                        'flex': '1', 'min-width': '220px', 'max-width': '350px', 'border': '1px solid #f1f5f9'
                    }),
                    
                    # KPI 2: Registros Críticos
                    html.Div([
                        html.Div([
                            html.Div([
                                html.Span("Registros críticos", 
                                    style={
                                        'font-size': '14px', 
                                        'font-weight': '600', 
                                        'color': '#64748b', 
                                        'text-transform': 'none'
                                    }),
                                html.H2(f"{registros_criticos}", 
                                    style={
                                        'font-size': '2.25rem', 
                                        'font-weight': '700', 
                                        'color': '#1e293b', 
                                        'margin': '8px 0 0 0'
                                    })
                            ], style={
                                'flex-grow': '1'
                                }),
                            # Icono
                            html.Div([
                                html.Img(src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', style={'width': '24px', 'height': '24px'})
                            ], style={'display': 'flex', 'align-items': 'center', 'justify-content': 'center', 'background-color': '#eff6ff', 'padding': '12px', 'border-radius': '8px'})
                        ], style={'display': 'flex', 'align-items': 'center'}),
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '20px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                        'flex': '1', 'min-width': '220px', 'max-width': '350px', 'border': '1px solid #f1f5f9'
                    }),
                ], style={'display': 'flex', 'gap': '20px', 'margin-bottom': '24px', 'flex-wrap': 'wrap'}),
                
                # Acomodar columnas
                html.Div([
                    # Columna izquierda
                    html.Div([
                        # Gráfica de burbujas
                        html.Div([
                            dcc.Graph(figure=fig_risk_matrix, config={'displayModeBar': False})
                        ], style={
                            'background-color': '#ffffff', 'border-radius': '12px', 'padding': '16px',
                            'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                            'margin-bottom': '24px', 'border': '1px solid #f1f5f9',
                            'height': '380px'
                        }),
                        
                        html.Div([
                            html.H3("Detalle de Alertas más Antiguas (Equipos Críticos)", 
                                style={
                                    'font-size': '16px', 
                                    'font-weight': '600', 
                                    'color': '#0f172a', 
                                    'margin': '0 0 16px 0', 
                                    'font-family': 'Outfit, sans-serif'
                                    }),
                            html.Div([
                                html.Table(table_header + table_body, 
                                    style={
                                        'width': '100%', 
                                        'border-collapse': 'collapse', 
                                        'font-family': 'Outfit, sans-serif'
                                        })
                            ], style={'overflow-x': 'auto'})
                        ], style={
                            'background-color': '#ffffff', 'border-radius': '12px', 'padding': '20px',
                            'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                            'border': '1px solid #f1f5f9'
                        })
                    ], style={'flex': '3', 'min-width': '500px'}),
                    
                    # Columna derecha
                    html.Div([
                        # Gráfica de barras
                        html.Div([
                            dcc.Graph(figure=fig_oldest_alerts, config={'displayModeBar': False})
                        ], style={
                            'background-color': '#ffffff', 'border-radius': '12px', 'padding': '16px',
                            'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                            'border': '1px solid #f1f5f9',
                            'height': '540px'
                        })
                    ], style={'flex': '2', 'min-width': '350px'})
                ], style={'display': 'flex', 'gap': '24px', 'flex-wrap': 'wrap'}),

                # Sección K-Means 
                html.H3('Clasificación de Prioridad Operativa',
                    style={
                        'font-size': '16px', 'font-weight': '700', 'color': '#0f172a',
                        'margin': '32px 0 16px 0', 'font-family': 'Outfit, sans-serif',
                        'border-top': '1px solid #e2e8f0', 'padding-top': '24px'
                    }),

                html.P(
                    'Esta clasificación agrupa las unidades de cada distribuidor basándose en sus horas de retraso acumuladas y el estado de sus alertas vigentes. Ayuda a identificar rápidamente qué distribuidores tienen la mayor concentración de equipos críticos para priorizar visitas de soporte, optimizar recursos y coordinar campañas preventivas.',
                    style={'font-size': '13px', 'color': '#64748b', 'margin': '0 0 20px 0', 'font-family': 'Outfit, sans-serif', 'line-height': '1.5'}
                ),

                # Tabla distribución de clusters por distribuidor
                html.Div([
                    html.H3('Distribución de Equipos en Riesgo por Distribuidor',
                        style={
                            'font-size': '15px', 'font-weight': '600', 'color': '#0f172a',
                            'margin': '0 0 14px 0', 'font-family': 'Outfit, sans-serif'
                        }),
                    html.P('Ordenado por mayor cantidad de unidades en Riesgo Alto',
                        style={'font-size': '12px', 'color': '#94a3b8', 'margin': '0 0 12px 0'}),
                    html.Div([
                        html.Table(
                            cluster_table_header + cluster_table_body,
                            style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Outfit, sans-serif', 'font-size': '13px'}
                        )
                    ], style={'overflow-x': 'auto'})
                ], style={
                    'background-color': '#ffffff', 'border-radius': '12px', 'padding': '20px',
                    'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
                    'border': '1px solid #f1f5f9', 'overflow-y': 'auto'
                })

            ], style={'padding': '16px 20px', 'background-color': '#f8fafc', 'min-height': '100vh', 'font-family': 'Outfit, sans-serif'})
        except Exception as e:
            return html.Div([
                html.Div([
                    html.H3("Error al procesar los datos", style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P(f"Ocurrió un error al cargar o analizar las bases de datos de mantenimientos: {str(e)}")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

    app_dash.layout = serve_layout
    return app_dash
