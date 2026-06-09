import os
import pandas as pd
import numpy as np
import dash
from dash import dcc, html
import plotly.express as px
import plotly.graph_objects as go

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN_FILES_DIR = os.path.join(BASE_DIR, 'data', 'ArchivosLimpios')

def init_monetizacion(server):
    app_dash = dash.Dash(
        __name__,
        server=server,
        url_base_pathname='/dash/monetizacion/',
        external_stylesheets=['https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap']
    )

    def serve_layout():
        maint_path = os.path.join(CLEAN_FILES_DIR, 'new_mantenimientos.xlsx')
        unidades_path = os.path.join(CLEAN_FILES_DIR, 'new_unidades.xlsx')
        pop_path = os.path.join(CLEAN_FILES_DIR, 'new_population.xlsx')

        # Revisar si existen los archivos
        if not all(os.path.exists(p) for p in [maint_path, unidades_path, pop_path]):
            return html.Div([
                html.Div([
                    html.H3("Faltan archivos de datos para monetización", 
                        style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P("Por favor, ve a la sección de 'Importar datos' y sube los archivos limpios necesarios.")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

        try:
            # Cargar los datos
            mantenimientos = pd.read_excel(maint_path)
            reporte = pd.read_excel(unidades_path)
            population = pd.read_excel(pop_path)

            # Procesar los datos
            mantenimientos['delay_vs_service_interval'] = mantenimientos['ACTUAL'] - mantenimientos['SERVICIO']
            status_risk_mapping = {'Cerrada': 0, 'PorVencer': 1, 'EnProceso': 1, 'Abierta': 1, 'Pendiente': 2, 'CerradaFuera': 2}
            mantenimientos['overdue_risk'] = mantenimientos['ESTATUS'].map(status_risk_mapping).fillna(0)

            # frecuencia_servicio_df
            frecuencia_servicio_df = mantenimientos.groupby('ALIAS').size().reset_index(name='frecuencia_servicio')

            # df_unidades_xgb
            df_unidades_xgb = reporte[['Alias', 'Fecha Alta']].copy()
            df_unidades_xgb.rename(columns={'Alias': 'ALIAS'}, inplace=True)
            df_unidades_xgb['Fecha Alta'] = pd.to_datetime(df_unidades_xgb['Fecha Alta'], errors='coerce')
            current_date = pd.to_datetime('today')
            df_unidades_xgb['edad_equipo'] = ((current_date - df_unidades_xgb['Fecha Alta']).dt.days / 365.25).round(2)
            df_unidades_xgb.dropna(subset=['edad_equipo'], inplace=True)

            # valor_acumulado_aftermarket
            columnas_valor_aftermarket = ['Cerrados', 'C.Fuera', 'Pendientes']
            for col in columnas_valor_aftermarket:
                reporte[col] = pd.to_numeric(reporte[col], errors='coerce')
            reporte['valor_acumulado_aftermarket'] = reporte[columnas_valor_aftermarket].fillna(0).sum(axis=1)
            valor_aftermarket_df = reporte[['Alias', 'valor_acumulado_aftermarket']].rename(columns={'Alias': 'ALIAS'}).copy()

            # Consolidación de datos
            rit_agg_df = mantenimientos.groupby('ALIAS').agg(
                avg_overdue_risk=('overdue_risk', 'mean'),
                avg_delay_vs_service_interval=('delay_vs_service_interval', 'mean'),
                DISTRIBUIDOR=('DISTRIBUIDOR', 'first')
            ).reset_index()

            df_population_xgb = population.rename(columns={'VIN (17 CHARACTERS)': 'NO SERIE', 'SEVERITY LEVEL': 'SEVERITY_LEVEL'}).copy()
            df_maint_with_severity = pd.merge(mantenimientos, df_population_xgb[['NO SERIE', 'SEVERITY_LEVEL']], on='NO SERIE', how='left')
            severity_per_alias = df_maint_with_severity.groupby('ALIAS')['SEVERITY_LEVEL'].agg(lambda x: x.mode()[0] if not x.mode().empty else np.nan).reset_index()

            df_monetization = pd.merge(frecuencia_servicio_df, valor_aftermarket_df, on='ALIAS', how='left')
            df_monetization = pd.merge(df_monetization, df_unidades_xgb[['ALIAS', 'edad_equipo']], on='ALIAS', how='left')
            df_monetization = pd.merge(df_monetization, rit_agg_df, on='ALIAS', how='left')
            df_monetization = pd.merge(df_monetization, severity_per_alias, on='ALIAS', how='left')

            # Manejar valores nulos antes de escalar
            df_monetization['avg_overdue_risk'] = df_monetization['avg_overdue_risk'].fillna(0)
            df_monetization['valor_acumulado_aftermarket'] = df_monetization['valor_acumulado_aftermarket'].fillna(0)

            # Escalamiento definiendo Min-Max
            rit_min, rit_max = df_monetization['avg_overdue_risk'].min(), df_monetization['avg_overdue_risk'].max()
            vae_min, vae_max = df_monetization['valor_acumulado_aftermarket'].min(), df_monetization['valor_acumulado_aftermarket'].max()

            if rit_max > rit_min:
                df_monetization['RIT_normalizado'] = (df_monetization['avg_overdue_risk'] - rit_min) / (rit_max - rit_min)
            else:
                df_monetization['RIT_normalizado'] = 0.0

            if vae_max > vae_min:
                df_monetization['VAE_normalizado'] = (df_monetization['valor_acumulado_aftermarket'] - vae_min) / (vae_max - vae_min)
            else:
                df_monetization['VAE_normalizado'] = 0.0

            df_monetization['score_oportunidad'] = df_monetization['RIT_normalizado'] * df_monetization['VAE_normalizado']

            # Unidades por oportunidad de monetización (Barra horizontal)
            top_15 = df_monetization.sort_values(by='score_oportunidad', ascending=False).head(15)

            # Unidades por oportunidad de monetización (Tabla)
            top_10_table = df_monetization.sort_values(by='score_oportunidad', ascending=False).head(10)

            # --------------------------------------------------------------------------
            # Chart 1: Top Unidades por Oportunidad de Monetización (Barra horizontal)
            # --------------------------------------------------------------------------
            fig_bar = px.bar(
                top_15,
                x='score_oportunidad',
                y='ALIAS',
                orientation='h',
                color='score_oportunidad',
                color_continuous_scale='Greens',
                labels={'score_oportunidad': 'score_oportunidad', 'ALIAS': 'ALIAS'}
            )
            fig_bar.update_layout(
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
                    title='score_oportunidad',
                    title_font=dict(size=10),
                    tickfont=dict(size=9)
                ),
                height=380
            )

            # --------------------------------------------------------------------------
            # Chart 2: Curva de Pareto (% unidades vs % potencial económico)
            # --------------------------------------------------------------------------
            df_pareto = df_monetization.sort_values(by='score_oportunidad', ascending=False).reset_index(drop=True)
            total_score = df_pareto['score_oportunidad'].sum()
            df_pareto['cumulative_score_pct'] = (df_pareto['score_oportunidad'].cumsum() / total_score) * 100
            df_pareto['cumulative_units_pct'] = (df_pareto.index + 1) / len(df_pareto) * 100

            fig_pareto = go.Figure()
            # Línea de score acumulado
            fig_pareto.add_trace(go.Scatter(
                x=df_pareto['cumulative_units_pct'],
                y=df_pareto['cumulative_score_pct'],
                name='Porcentaje Acumulado de Score de Oportunidad',
                line=dict(color='#ef4444', width=3),
                mode='lines'
            ))
            # Línea de score individual
            fig_pareto.add_trace(go.Scatter(
                x=df_pareto['cumulative_units_pct'],
                y=df_pareto['score_oportunidad'],
                name='Score de Oportunidad (Individual)',
                line=dict(color='#3b82f6', width=1.5),
                mode='lines',
                yaxis='y2'
            ))

            # Calcular dinámicamente el punto de corte donde se acumula el 80% de la oportunidad
            df_target = df_pareto[df_pareto['cumulative_score_pct'] >= 80.0]
            x_cutoff = df_target['cumulative_units_pct'].min() if not df_target.empty else 80.0

            fig_pareto.add_trace(go.Scatter(
                x=[x_cutoff, x_cutoff],
                y=[0, 100],
                name=f"Corte 80% Oportunidad Acumulada",
                mode='lines',
                line=dict(color='#64748b', width=1.5, dash='dash'),
                showlegend=True
            ))

            fig_pareto.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font_family='Outfit, sans-serif',
                font_color='#475569',
                xaxis=dict(title='Porcentaje Acumulado de Unidades', gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False),
                yaxis=dict(title='Porcentaje Acumulado de Score de Oportunidad', gridcolor='#e2e8f0', linecolor='#cbd5e1', zeroline=False, range=[0, 105]),
                yaxis2=dict(
                    title='Score de Oportunidad (Individual)',
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
            # Chart 3: Gráfico de barras agrupadas (Score por componente)
            # -------------------------------------------------------------
            df_melt = top_15.melt(id_vars='ALIAS', value_vars=['RIT_normalizado', 'VAE_normalizado'], var_name='Componente', value_name='Valor Normalizado')
            fig_grouped = px.bar(
                df_melt,
                x='ALIAS',
                y='Valor Normalizado',
                color='Componente',
                barmode='group',
                color_discrete_map={'RIT_normalizado': '#ea580c', 'VAE_normalizado': '#0284c7'},
                labels={'Componente': 'Componente de Score'}
            )
            

            # -------------------------------------------------------------
            # Tabla Score Oportunidad
            # -------------------------------------------------------------
            def get_score_badge_style(score):
                # Mapear colores según el valor del score
                if score == 1.0:
                    return {'background-color': '#2b6b0c', 'color': '#ffffff', 'border': '1.5px solid #2b6b0c', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif score >= 0.8:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #52a825', 'color': '#2b6b0c', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif score >= 0.7:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #7dc75e', 'color': '#3f8719', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif score >= 0.6:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #a3db88', 'color': '#52a825', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}
                else:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #c2e7b0', 'color': '#52a825', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '44px', 'height': '20px', 'border-radius': '3px', 'font-weight': '700', 'font-size': '0.75rem'}

            table_header = [
                html.Tr([
                    html.Th("Unidad", 
                        style={
                            'text-align': 'left', 
                            'padding': '8px 10px', 
                            'font-weight': '600', 
                            'color': '#6b7280', 
                            'border-bottom': '1px solid #e5e7eb', 
                            'background-color': '#fafbfc'
                        }),
                    html.Th("Distribuidor", 
                        style={
                            'text-align': 'left', 
                            'padding': '8px 10px', 
                            'font-weight': '600', 
                            'color': '#6b7280', 
                            'border-bottom': '1px solid #e5e7eb', 
                            'background-color': '#fafbfc'
                        }),
                    html.Th("Score oportunidad", 
                        style={
                            'text-align': 'center', 
                            'padding': '8px 10px', 
                            'font-weight': '600', 
                            'color': '#6b7280', 
                            'border-bottom': '1px solid #e5e7eb', 
                            'background-color': '#fafbfc'
                        }),
                    html.Th("Retraso", 
                        style={
                            'text-align': 'left', 
                            'padding': '8px 10px', 
                            'font-weight': '600', 
                            'color': '#6b7280', 
                            'border-bottom': '1px solid #e5e7eb', 
                            'background-color': '#fafbfc'
                        })
                ])
            ]

            table_rows = []
            for idx, row in top_10_table.iterrows():
                delay_val = row['avg_delay_vs_service_interval']
                delay_str = f"{int(delay_val)} horas" if not pd.isnull(delay_val) else "0 horas"
                
                table_rows.append(html.Tr([
                    html.Td(row['ALIAS'], style={'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6', 'font-weight': '600', 'color': '#1e293b'}),
                    html.Td(row['DISTRIBUIDOR'] if not pd.isnull(row['DISTRIBUIDOR']) else 'Desconocido', style={'padding': '8px 10px', 'border-bottom': '1px solid #f3f4f6'}),
                    html.Td(
                        html.Span(f"{row['score_oportunidad']:.1f}", style=get_score_badge_style(row['score_oportunidad'])),
                            style={
                                'text-align': 'center', 
                                'padding': '8px 10px', 
                                'border-bottom': '1px solid #f3f4f6'}
                    ),
                    html.Td(delay_str, 
                        style={
                            'padding': '8px 10px', 
                            'border-bottom': '1px solid #f3f4f6'})
                ]))

            # Regresar el layout del dashboard
            return html.Div([
                # Fila 1: Tabla y Gráfico de barras horizontales
                html.Div([
                    # Izquierda: Tarjeta de tabla
                    html.Div([
                        html.Table(table_header + table_rows, style={
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
                        html.H3("Top Unidades por Oportunidad de Monetización", style={'font-size': '1.125rem', 'font-weight': '700', 'color': '#10123C', 'margin-top': '0', 'margin-bottom': '16px', 'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=fig_bar, config={'displayModeBar': False})
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
                        html.H3("Curva pereto (% unidades vs % potencial económico)", style={
                            'font-size': '1.125rem', 
                            'font-weight': '700', 
                            'color': '#10123C', 
                            'margin-top': '0', 
                            'margin-bottom': '16px', 
                            'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=fig_pareto, config={'displayModeBar': False})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px'
                    }),
                    
                    # Derecha: Tarjeta de gráfico de barras agrupadas
                    html.Div([
                        html.H3("Score de oportunidad por variable", style={'font-size': '1.125rem', 'font-weight': '700', 'color': '#10123C', 'margin-top': '0', 'margin-bottom': '16px', 'font-family': 'Outfit, sans-serif'}),
                        dcc.Graph(figure=fig_grouped, config={'displayModeBar': False})
                    ], style={
                        'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px',
                        'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                        'flex': '1', 'min-width': '380px'
                    })
                ], style={'display': 'flex', 'gap': '24px', 'flex-wrap': 'wrap'})
            ], style={'padding': '16px 0px', 'background-color': '#f8fafc', 'min-height': '100vh', 'font-family': 'Outfit, sans-serif'})

        except Exception as e:
            return html.Div([
                html.Div([
                    html.H3("Error al calcular la monetización", style={'color': '#ef4444', 'margin-bottom': '12px', 'font-weight': '600'}),
                    html.P(f"Ocurrió un error al procesar las bases de datos: {str(e)}")
                ], style={
                    'padding': '30px', 'background-color': '#ffffff', 'border-radius': '12px',
                    'box-shadow': '0 4px 6px -1px rgba(0,0,0,0.1)', 'max-width': '600px', 'margin': '100px auto',
                    'font-family': 'Outfit, sans-serif', 'text-align': 'center'
                })
            ], style={'background-color': '#f8fafc', 'min-height': '100vh', 'padding': '20px'})

    app_dash.layout = serve_layout
    return app_dash
