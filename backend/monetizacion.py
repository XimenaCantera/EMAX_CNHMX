import os
import pandas as pd
import numpy as np
import dash
from dash import dcc, html
import plotly.express as px
import plotly.graph_objects as go

# Definición de rutas del proyecto
DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRECTORIO_ARCHIVOS_LIMPIOS = os.path.join(DIRECTORIO_BASE, 'data', 'ArchivosLimpios')

def inicializar_monetizacion(servidor_flask):
    """
    Iniciamos el dashboard analítico de Dash con el servidor web Flask principal
    """
    aplicacion_dash = dash.Dash(
        __name__,
        server=servidor_flask,
        url_base_pathname='/dash/monetizacion/',
        external_stylesheets=['https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap']
    )
    
    from plantillas_dash import PLANTILLA_HTML_CARGANDO
    aplicacion_dash.index_string = PLANTILLA_HTML_CARGANDO

    def servir_diseno_dashboard():
        """
        Diseño de interfaces y construcción del diseño dinámico del tablero.
        """
        ruta_mantenimientos = os.path.join(DIRECTORIO_ARCHIVOS_LIMPIOS, 'new_mantenimientos.xlsx')
        ruta_unidades = os.path.join(DIRECTORIO_ARCHIVOS_LIMPIOS, 'new_unidades.xlsx')
        ruta_poblacion = os.path.join(DIRECTORIO_ARCHIVOS_LIMPIOS, 'new_population.xlsx')

        # Verificar que existan todos los datasets antes de continuar
        if not all(os.path.exists(p) for p in [ruta_mantenimientos, ruta_unidades, ruta_poblacion]):
            return html.Div([
                html.Div([
                    html.H3("Faltan archivos de datos para mostrar la monetización", 
                        style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P("Por favor, ve a la sección de 'Importar datos' y sube los archivos limpios necesarios.")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

        try:
            # Carga de datos desde los archivos
            df_mantenimientos = pd.read_excel(ruta_mantenimientos)
            df_reporte = pd.read_excel(ruta_unidades)
            df_poblacion = pd.read_excel(ruta_poblacion)


            # Calcular retrasos en mantenimientos
            df_mantenimientos['delay_vs_service_interval'] = df_mantenimientos['ACTUAL'] - df_mantenimientos['SERVICIO']
            
            # Riesgo de retraso
            mapeo_riesgo_estatus = {'Cerrada': 0, 'PorVencer': 1, 'EnProceso': 1, 'Abierta': 1, 'Pendiente': 2, 'CerradaFuera': 2}
            df_mantenimientos['overdue_risk'] = df_mantenimientos['ESTATUS'].map(mapeo_riesgo_estatus).fillna(0)

            # Frecuencias de servicio por ALIAS de equipo
            df_frecuencia_servicio = df_mantenimientos.groupby('ALIAS').size().reset_index(name='frecuencia_servicio')

            # Calcular edad de los equipos
            df_unidades = df_reporte[['Alias', 'Fecha Alta']].copy()
            df_unidades.rename(columns={'Alias': 'ALIAS'}, inplace=True)
            df_unidades['Fecha Alta'] = pd.to_datetime(df_unidades['Fecha Alta'], errors='coerce')
            fecha_actual = pd.to_datetime('today')
            df_unidades['edad_equipo'] = ((fecha_actual - df_unidades['Fecha Alta']).dt.days / 365.25).round(2)
            df_unidades.dropna(subset=['edad_equipo'], inplace=True)

            # Cálcular de valor acumulado en aftermarket
            columnas_valor_aftermarket = ['Cerrados', 'C.Fuera', 'Pendientes']
            for col in columnas_valor_aftermarket:
                df_reporte[col] = pd.to_numeric(df_reporte[col], errors='coerce')
            df_reporte['valor_acumulado_aftermarket'] = df_reporte[columnas_valor_aftermarket].fillna(0).sum(axis=1)
            df_valor_aftermarket = df_reporte[['Alias', 'valor_acumulado_aftermarket']].rename(columns={'Alias': 'ALIAS'}).copy()

            df_agrupado_riesgo = df_mantenimientos.groupby('ALIAS').agg(
                avg_overdue_risk=('overdue_risk', 'mean'),
                avg_delay_vs_service_interval=('delay_vs_service_interval', 'mean'),
                DISTRIBUIDOR=('DISTRIBUIDOR', 'first')
            ).reset_index()

            # Combinación de dataframes
            df_poblacion_unidad = df_poblacion.rename(columns={'VIN (17 CHARACTERS)': 'NO SERIE', 'SEVERITY LEVEL': 'SEVERITY_LEVEL'}).copy()
            df_mantenimientos_severidad = pd.merge(df_mantenimientos, df_poblacion_unidad[['NO SERIE', 'SEVERITY_LEVEL']], on='NO SERIE', how='left')
            df_severidad_por_alias = df_mantenimientos_severidad.groupby('ALIAS')['SEVERITY_LEVEL'].agg(lambda x: x.mode()[0] if not x.mode().empty else np.nan).reset_index()

            # Integración final de dataframes
            df_monetizacion_final = pd.merge(df_frecuencia_servicio, df_valor_aftermarket, on='ALIAS', how='left')
            df_monetizacion_final = pd.merge(df_monetizacion_final, df_unidades[['ALIAS', 'edad_equipo']], on='ALIAS', how='left')
            df_monetizacion_final = pd.merge(df_monetizacion_final, df_agrupado_riesgo, on='ALIAS', how='left')
            df_monetizacion_final = pd.merge(df_monetizacion_final, df_severidad_por_alias, on='ALIAS', how='left')

            # Limpieza de datos
            df_monetizacion_final['avg_overdue_risk'] = df_monetizacion_final['avg_overdue_risk'].fillna(0)
            df_monetizacion_final['valor_acumulado_aftermarket'] = df_monetizacion_final['valor_acumulado_aftermarket'].fillna(0)

            # Transformación de datos (Normalización)
            riesgo_minimo, riesgo_maximo = df_monetizacion_final['avg_overdue_risk'].min(), df_monetizacion_final['avg_overdue_risk'].max()
            valor_aftermarket_minimo, valor_aftermarket_maximo = df_monetizacion_final['valor_acumulado_aftermarket'].min(), df_monetizacion_final['valor_acumulado_aftermarket'].max()

            if riesgo_maximo > riesgo_minimo:
                df_monetizacion_final['riesgo_retraso_norm'] = (df_monetizacion_final['avg_overdue_risk'] - riesgo_minimo) / (riesgo_maximo - riesgo_minimo)
            else:
                df_monetizacion_final['riesgo_retraso_norm'] = 0.0

            if valor_aftermarket_maximo > valor_aftermarket_minimo:
                df_monetizacion_final['valor_aftermarket_norm'] = (df_monetizacion_final['valor_acumulado_aftermarket'] - valor_aftermarket_minimo) / (valor_aftermarket_maximo - valor_aftermarket_minimo)
            else:
                df_monetizacion_final['valor_aftermarket_norm'] = 0.0

            df_monetizacion_final['puntaje_oportunidad'] = df_monetizacion_final['riesgo_retraso_norm'] * df_monetizacion_final['valor_aftermarket_norm']

            # Mejores unidades según puntaje
            mejores_15_unidades = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).head(15)
            tabla_top_10 = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).head(10)

            # -----------------------------------------------------
            # Chart 1 (Oportunidad por Unidad)
            # -----------------------------------------------------
            figura_barras_oportunidad = px.bar(
                mejores_15_unidades,
                x='puntaje_oportunidad',
                y='ALIAS',
                orientation='h',
                color='puntaje_oportunidad',
                color_continuous_scale='Blues',
                labels={'puntaje_oportunidad': 'Puntaje de Oportunidad', 'ALIAS': 'Unidad'}
            )
            figura_barras_oportunidad.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_family='Outfit, sans-serif',
                font_color='#475569',
                title_font_size=16,
                title_font_color='#1e293b',
                title_font_family='Outfit, sans-serif',
                margin=dict(l=10, r=10, t=10, b=10),
                xaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
                yaxis=dict(categoryorder='total ascending', gridcolor='#e2e8f0', linecolor='#cbd5e1', showgrid=False),
                coloraxis_showscale=True,
                coloraxis_colorbar=dict(
                    thickness=15,
                    title='Oportunidad',
                    title_font=dict(size=10),
                    tickfont=dict(size=9)
                ),
                height=380
            )

            # -------------------------------------------------
            # Chart 2 (Curva de Pareto)
            # -------------------------------------------------
            df_curva_pareto = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).reset_index(drop=True)
            puntaje_total = df_curva_pareto['puntaje_oportunidad'].sum()
            df_curva_pareto['cumulative_score_pct'] = (df_curva_pareto['puntaje_oportunidad'].cumsum() / puntaje_total) * 100
            df_curva_pareto['cumulative_units_pct'] = (df_curva_pareto.index + 1) / len(df_curva_pareto) * 100

            figura_pareto = go.Figure()
            # Línea de score acumulado
            figura_pareto.add_trace(go.Scatter(
                x=df_curva_pareto['cumulative_units_pct'],
                y=df_curva_pareto['cumulative_score_pct'],
                name='Porcentaje Acumulado de Oportunidad',
                line=dict(color='#991b1b', width=3),
                mode='lines'
            ))
            # Línea de score individual
            figura_pareto.add_trace(go.Scatter(
                x=df_curva_pareto['cumulative_units_pct'],
                y=df_curva_pareto['puntaje_oportunidad'],
                name='Puntaje de Oportunidad (Individual)',
                line=dict(color='#f87171', width=1.5),
                mode='lines',
                yaxis='y2'
            ))

            # Calcular punto de corte sobre el 80% de oportunidad acumulada
            df_objetivo = df_curva_pareto[df_curva_pareto['cumulative_score_pct'] >= 80.0]
            punto_corte_x = df_objetivo['cumulative_units_pct'].min() if not df_objetivo.empty else 80.0

            figura_pareto.add_trace(go.Scatter(
                x=[punto_corte_x, punto_corte_x],
                y=[0, 100],
                name="Corte 80% Oportunidad Acumulada",
                mode='lines',
                line=dict(color='#64748b', width=1.5, dash='dash'),
                showlegend=True
            ))

            figura_pareto.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_family='Outfit, sans-serif',
                font_color='#475569',
                xaxis=dict(title='Porcentaje Acumulado de Unidades (%)', gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
                yaxis=dict(title='Porcentaje Acumulado de Oportunidad (%)', gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False, range=[0, 105]),
                yaxis2=dict(
                    title='Puntaje de Oportunidad (Individual)',
                    overlaying='y',
                    side='right',
                    showgrid=False,
                    range=[0, 1.05]
                ),
                height=350,
                margin=dict(l=10, r=10, t=10, b=10),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=9))
            )

            # -------------------------------------------------------------
            # Chart 3 (Barras Agrupadas)
            # -------------------------------------------------------------
            df_reestructurado_variables = mejores_15_unidades.copy()
            df_reestructurado_variables.rename(columns={
                'riesgo_retraso_norm': 'Riesgo de Retraso (RIT)',
                'valor_aftermarket_norm': 'Valor de Aftermarket (VAE)'
            }, inplace=True)
            df_reestructurado_variables = df_reestructurado_variables.melt(
                id_vars='ALIAS',
                value_vars=['Riesgo de Retraso (RIT)', 'Valor de Aftermarket (VAE)'],
                var_name='Componente',
                value_name='Valor Normalizado'
            )
            figura_barras_agrupadas = px.bar(
                df_reestructurado_variables,
                x='ALIAS',
                y='Valor Normalizado',
                color='Componente',
                barmode='group',
                color_discrete_map={
                    'Riesgo de Retraso (RIT)': '#dc2626',
                    'Valor de Aftermarket (VAE)': '#3b82f6'
                },
                labels={'ALIAS': 'Unidad', 'Componente': 'Componente de Puntaje'}
            )
            figura_barras_agrupadas.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_family='Outfit, sans-serif',
                font_color='#475569',
                margin=dict(l=10, r=10, t=10, b=10),
                xaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
                yaxis=dict(gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
                height=350,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=9))
            )

            # -------------------------------
            # Tabla de Score
            # -------------------------------
            def obtener_estilo_etiqueta_puntaje(puntaje):
                if puntaje == 1.0:
                    return {'background-color': '#dc2626', 'color': '#ffffff', 'border': '1.5px solid #dc2626', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif puntaje >= 0.8:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #ef4444', 'color': '#dc2626', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif puntaje >= 0.7:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #f87171', 'color': '#b91c1c', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif puntaje >= 0.6:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #fca5a5', 'color': '#dc2626', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                else:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #fee2e2', 'color': '#ef4444', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}

            cabecera_tabla = [
                html.Tr([
                    html.Th("Unidad", 
                        style={'text-align': 'left', 'padding': '8px 10px', 'font-weight': '600', 'color': '#6b7280', 'border-bottom': '1px solid #e5e7eb', 'background-color': '#fafbfc'}),
                    html.Th("Distribuidor", 
                        style={'text-align': 'left', 'padding': '8px 10px', 'font-weight': '600', 'color': '#6b7280', 'border-bottom': '1px solid #e5e7eb', 'background-color': '#fafbfc'}),
                    html.Th("Puntaje Oportunidad", 
                        style={'text-align': 'center', 'padding': '8px 10px', 'font-weight': '600', 'color': '#6b7280', 'border-bottom': '1px solid #e5e7eb', 'background-color': '#fafbfc'}),
                    html.Th("Retraso", 
                        style={'text-align': 'left', 'padding': '8px 10px', 'font-weight': '600', 'color': '#6b7280', 'border-bottom': '1px solid #e5e7eb', 'background-color': '#fafbfc'})
                ])
            ]

            filas_tabla = []
            for _, row in tabla_top_10.iterrows():

                delay_val = row['avg_delay_vs_service_interval']
                texto_retraso = f"{int(delay_val)} horas" if not pd.isnull(delay_val) else "0 horas"
                
                filas_tabla.append(html.Tr([
                    html.Td(row['ALIAS'], 
                        style={'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6', 'font-weight': '600', 'color': '#1e293b'}),
                    html.Td(row['DISTRIBUIDOR'] if not pd.isnull(row['DISTRIBUIDOR']) else 'Desconocido', 
                        style={'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6'}),
                    html.Td(
                        html.Span(f"{row['puntaje_oportunidad']:.2f}", 
                        style=obtener_estilo_etiqueta_puntaje(row['puntaje_oportunidad'])),
                        style={'text-align': 'center', 'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6'}
                    ),
                    html.Td(texto_retraso, 
                        style={'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6'})
                ]))

            # Regresa el layout del dashboard
            return html.Div([
                # Fila 1: Tabla y Gráfico de barras horizontales
                html.Div([
                    # Izquierda: Tarjeta de tabla
                    html.Div([
                        html.Table(cabecera_tabla + filas_tabla, style={
                            'width': '100%', 
                            'border-collapse': 'collapse', 
                            'font-family': 'Inter, sans-serif',
                            'font-size': '0.75rem'})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '16px 12px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px', 'overflow-x': 'auto'
                    }),
                    
                    # Derecha: Tarjeta de gráfico de barras
                    html.Div([
                        html.H3("Unidades con Mayor Oportunidad de Monetización", style={'font-size': '1.125rem', 'font-weight': '700', 'color': '#10123C', 'margin-top': '0', 'margin-bottom': '16px', 'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=figura_barras_oportunidad, config={'displayModeBar': False})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px'
                    })
                ], style={
                    'display': 'flex', 
                    'gap': '24px', 
                    'margin-bottom': '24px', 
                    'flex-wrap': 'wrap'}),
                
                # Fila 2: Curva de Pareto y Gráfico de barras agrupadas
                html.Div([
                    # Izquierda: Curva de Pareto
                    html.Div([
                        html.H3("Curva de Pareto (% Unidades vs % Potencial Económico)", style={
                            'font-size': '1.125rem', 
                            'font-weight': '700', 
                            'color': '#10123C', 
                            'margin-top': '0', 
                            'margin-bottom': '16px', 
                            'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=figura_pareto, config={'displayModeBar': False})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px'
                    }),
                    
                    # Derecha: Tarjeta de gráfico de barras agrupadas
                    html.Div([
                        html.H3("Desglose del Puntaje de Oportunidad", style={'font-size': '1.125rem', 'font-weight': '700', 'color': '#10123C', 'margin-top': '0', 'margin-bottom': '16px', 'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=figura_barras_agrupadas, config={'displayModeBar': False})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px'
                    })
                ], style={'display': 'flex', 'gap': '24px', 'flex-wrap': 'wrap'})
            ], style={'padding': '16px 0px', 'background-color': '#f8fafc', 'min-height': '100vh', 'font-family': 'Outfit, sans-serif'})

        except Exception as error_proceso:
            return html.Div([
                html.Div([
                    html.H3("Error al calcular la monetización", style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P(f"Ocurrió un error al procesar las bases de datos: {str(error_proceso)}")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

    aplicacion_dash.layout = servir_diseno_dashboard
    return aplicacion_dash

init_monetizacion = inicializar_monetizacion
