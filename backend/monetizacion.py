import os
import pandas as pd
import numpy as np
import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.express as px
import plotly.graph_objects as go
import xgboost as xgb
from sklearn.model_selection import train_test_split, StratifiedKFold

# Definición de rutas del proyecto
DIRECTORIO_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRECTORIO_ARCHIVOS_LIMPIOS = os.path.join(DIRECTORIO_BASE, 'data', 'ArchivosLimpios')

# Caché global para almacenar los dataframes procesados
_CACHE_MONETIZACION = {}

# Cabeceras de tabla a nivel de módulo para ser accesibles por callbacks y layout
cabecera_tabla_prediccion = [
    html.Tr([
        html.Th("Unidad", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Distribuidor", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Valor Aftermarket", style={'text-align': 'right', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Probabilidad Monetización", style={'text-align': 'center', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'})
    ])
]

cabecera_tabla_servicios = [
    html.Tr([
        html.Th("ID Mantenimiento", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Unidad", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Estatus Actual", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Distribuidor", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
        html.Th("Probabilidad de Retraso", style={'text-align': 'center', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'})
    ])
]

def obtener_estilo_badge_probabilidad(prob):
    if prob >= 0.8:
        return {'background-color': '#fee2e2', 'color': '#991b1b', 'border': '1px solid #fca5a5', 'padding': '2px 8px', 'border-radius': '12px', 'font-weight': '600', 'font-size': '0.75rem'}
    elif prob >= 0.5:
        return {'background-color': '#ffedd5', 'color': '#c2410c', 'border': '1px solid #fed7aa', 'padding': '2px 8px', 'border-radius': '12px', 'font-weight': '600', 'font-size': '0.75rem'}
    else:
        return {'background-color': '#dcfce7', 'color': '#15803d', 'border': '1px solid #bbf7d0', 'padding': '2px 8px', 'border-radius': '12px', 'font-weight': '600', 'font-size': '0.75rem'}

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
            df_unidades = df_unidades.drop_duplicates(subset=['ALIAS'])

            # Cálculo de valor acumulado en aftermarket
            columnas_valor_aftermarket = ['Cerrados', 'C.Fuera', 'Pendientes']
            for col in columnas_valor_aftermarket:
                df_reporte[col] = pd.to_numeric(df_reporte[col], errors='coerce')
            df_reporte['valor_acumulado_aftermarket'] = df_reporte[columnas_valor_aftermarket].fillna(0).sum(axis=1)
            df_valor_aftermarket = df_reporte[['Alias', 'valor_acumulado_aftermarket']].rename(columns={'Alias': 'ALIAS'}).copy()
            df_valor_aftermarket = df_valor_aftermarket.drop_duplicates(subset=['ALIAS'])

            df_agrupado_riesgo = df_mantenimientos.groupby('ALIAS').agg(
                avg_overdue_risk=('overdue_risk', 'mean'),
                avg_delay_vs_service_interval=('delay_vs_service_interval', 'mean'),
                DISTRIBUIDOR=('DISTRIBUIDOR', 'first')
            ).reset_index()

            # Combinación de dataframes
            df_poblacion_unidad = df_poblacion.rename(columns={'VIN (17 CHARACTERS)': 'NO SERIE', 'SEVERITY LEVEL': 'SEVERITY_LEVEL'}).copy()
            df_poblacion_unidad = df_poblacion_unidad.drop_duplicates(subset=['NO SERIE'])
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

            # Mejores unidades según puntaje (Tab 1)
            mejores_15_unidades = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).head(15)
            tabla_top_10 = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).head(10)

            # ============================================
            # ENTRENAMIENTO DE MODELOS XGBOOST
            # ============================================
            
            # --- Predicción de Retraso de Servicio (Pendiente/CerradaFuera) ---
            df_mantenimiento_xgb = df_mantenimientos.copy()
            df_mantenimiento_xgb['mantenimiento_pendiente_fuera'] = df_mantenimiento_xgb['ESTATUS'].apply(
                lambda s: 1 if s in ['Pendiente', 'CerradaFuera'] else (0 if s == 'Cerrada' else np.nan)
            )
            df_mantenimiento_xgb.dropna(subset=['mantenimiento_pendiente_fuera'], inplace=True)
            df_mantenimiento_xgb['mantenimiento_pendiente_fuera'] = df_mantenimiento_xgb['mantenimiento_pendiente_fuera'].astype(int)

            df_mantenimiento_xgb = pd.merge(df_mantenimiento_xgb, df_frecuencia_servicio, on='ALIAS', how='left')
            df_mantenimiento_xgb = pd.merge(df_mantenimiento_xgb, df_unidades[['ALIAS', 'edad_equipo']], on='ALIAS', how='left')
            df_mantenimiento_xgb = pd.merge(df_mantenimiento_xgb, df_poblacion_unidad[['NO SERIE', 'SEVERITY_LEVEL']], on='NO SERIE', how='left')

            df_model_maint = df_mantenimiento_xgb[['mantenimiento_pendiente_fuera', 'frecuencia_servicio', 'edad_equipo', 'SEVERITY_LEVEL']].copy()
            df_model_maint['frecuencia_servicio'] = df_model_maint['frecuencia_servicio'].fillna(0)
            df_model_maint['edad_equipo'] = df_model_maint['edad_equipo'].fillna(df_model_maint['edad_equipo'].median() if not df_model_maint['edad_equipo'].dropna().empty else 2.0)
            df_model_maint['SEVERITY_LEVEL'] = df_model_maint['SEVERITY_LEVEL'].fillna('Medium')

            # One-Hot Encoding
            df_model_maint_encoded = pd.get_dummies(df_model_maint, columns=['SEVERITY_LEVEL'], drop_first=True)
            # Asegurar consistencia de columnas de severidad
            for level in ['Medium', 'High', 'Low', 'Critical']:
                col = f'SEVERITY_LEVEL_{level}'
                if col not in df_model_maint_encoded.columns and col != 'SEVERITY_LEVEL_Medium': # Since drop_first removes one
                    df_model_maint_encoded[col] = 0

            X_maint = df_model_maint_encoded.drop(columns=['mantenimiento_pendiente_fuera'])
            y_maint = df_model_maint_encoded['mantenimiento_pendiente_fuera']

            # regularized model for Delay
            model_xgb_maint = xgb.XGBClassifier(
                objective='binary:logistic',
                eval_metric='logloss',
                max_depth=3,
                learning_rate=0.1,
                n_estimators=30,
                min_child_weight=3,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42
            )
            model_xgb_maint.fit(X_maint, y_maint)

            # --- MODELO 2: Alta Oportunidad de Monetización ---
            percentil_75 = df_monetizacion_final['puntaje_oportunidad'].quantile(0.75)
            df_monetizacion_final['oportunidad_alta'] = (df_monetizacion_final['puntaje_oportunidad'] >= percentil_75).astype(int)

            df_model_monet = df_monetizacion_final[['frecuencia_servicio', 'edad_equipo', 'avg_delay_vs_service_interval', 'SEVERITY_LEVEL']].copy()
            df_model_monet['frecuencia_servicio'] = df_model_monet['frecuencia_servicio'].fillna(0)
            df_model_monet['edad_equipo'] = df_model_monet['edad_equipo'].fillna(df_model_monet['edad_equipo'].median() if not df_model_monet['edad_equipo'].dropna().empty else 2.0)
            df_model_monet['avg_delay_vs_service_interval'] = df_model_monet['avg_delay_vs_service_interval'].fillna(0)
            df_model_monet['SEVERITY_LEVEL'] = df_model_monet['SEVERITY_LEVEL'].fillna('Medium')

            df_model_monet_encoded = pd.get_dummies(df_model_monet, columns=['SEVERITY_LEVEL'], drop_first=True)
            for level in ['Medium', 'High', 'Low', 'Critical']:
                col = f'SEVERITY_LEVEL_{level}'
                if col not in df_model_monet_encoded.columns and col != 'SEVERITY_LEVEL_Medium':
                    df_model_monet_encoded[col] = 0

            # Asegurar las mismas columnas para consistencia
            X_monet = df_model_monet_encoded.copy()
            y_monet = df_monetizacion_final['oportunidad_alta']

            # Use StratifiedKFold to get out-of-fold predicted probabilities for training set to avoid overfitting
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            oof_probs_monet = np.zeros(len(X_monet))

            for train_idx, val_idx in cv.split(X_monet, y_monet):
                X_train_cv, y_train_cv = X_monet.iloc[train_idx], y_monet.iloc[train_idx]
                X_val_cv = X_monet.iloc[val_idx]
                
                model_cv = xgb.XGBClassifier(
                    objective='binary:logistic',
                    eval_metric='logloss',
                    max_depth=3,
                    learning_rate=0.1,
                    n_estimators=30,
                    min_child_weight=3,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    random_state=42
                )
                model_cv.fit(X_train_cv, y_train_cv)
                oof_probs_monet[val_idx] = model_cv.predict_proba(X_val_cv)[:, 1]

            df_monetizacion_final['y_pred_proba_monetization'] = oof_probs_monet

            # Predicción para mantenimientos activos
            df_mantenimientos_activos = df_mantenimientos[df_mantenimientos['ESTATUS'] != 'Cerrada'].copy()
            if not df_mantenimientos_activos.empty:
                df_act_features = df_mantenimientos_activos.copy()
                df_act_features = pd.merge(df_act_features, df_frecuencia_servicio, on='ALIAS', how='left')
                df_act_features = pd.merge(df_act_features, df_unidades[['ALIAS', 'edad_equipo']], on='ALIAS', how='left')
                df_act_features = pd.merge(df_act_features, df_poblacion_unidad[['NO SERIE', 'SEVERITY_LEVEL']], on='NO SERIE', how='left')

                df_act_features = df_act_features[['frecuencia_servicio', 'edad_equipo', 'SEVERITY_LEVEL']].copy()
                df_act_features['frecuencia_servicio'] = df_act_features['frecuencia_servicio'].fillna(0)
                df_act_features['edad_equipo'] = df_act_features['edad_equipo'].fillna(df_model_maint['edad_equipo'].median())
                df_act_features['SEVERITY_LEVEL'] = df_act_features['SEVERITY_LEVEL'].fillna('Medium')

                df_act_encoded = pd.get_dummies(df_act_features, columns=['SEVERITY_LEVEL'], drop_first=True)
                for col in X_maint.columns:
                    if col not in df_act_encoded.columns:
                        df_act_encoded[col] = 0
                df_act_encoded = df_act_encoded[X_maint.columns]

                df_mantenimientos_activos['prob_retraso'] = model_xgb_maint.predict_proba(df_act_encoded)[:, 1]
            else:
                df_mantenimientos_activos['prob_retraso'] = []


            # Guardar resultados en caché global
            global _CACHE_MONETIZACION
            _CACHE_MONETIZACION = {
                'df_monetizacion_final': df_monetizacion_final,
                'df_mantenimientos_activos': df_mantenimientos_activos
            }

            # ===================================================
            # CONSTRUCCIÓN DE GRÁFICOS (TAB 1)
            # ===================================================
            
            # Chart 1: Oportunidad por Unidad (Barras Horizontales)
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

            # Chart 2: Curva de Pareto
            df_curva_pareto = df_monetizacion_final.sort_values(by='puntaje_oportunidad', ascending=False).reset_index(drop=True)
            puntaje_total = df_curva_pareto['puntaje_oportunidad'].sum()
            df_curva_pareto['cumulative_score_pct'] = (df_curva_pareto['puntaje_oportunidad'].cumsum() / (puntaje_total if puntaje_total > 0 else 1.0)) * 100
            df_curva_pareto['cumulative_units_pct'] = (df_curva_pareto.index + 1) / len(df_curva_pareto) * 100

            figura_pareto = go.Figure()
            figura_pareto.add_trace(go.Scatter(
                x=df_curva_pareto['cumulative_units_pct'],
                y=df_curva_pareto['cumulative_score_pct'],
                name='Porcentaje Acumulado de Oportunidad',
                line=dict(color='#991b1b', width=3),
                mode='lines'
            ))
            figura_pareto.add_trace(go.Scatter(
                x=df_curva_pareto['cumulative_units_pct'],
                y=df_curva_pareto['puntaje_oportunidad'],
                name='Puntaje de Oportunidad (Individual)',
                line=dict(color='#f87171', width=1.5),
                mode='lines',
                yaxis='y2'
            ))

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

            # Chart 3: Barras Agrupadas
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

            # =========================================================================
            # COMPONENTES DE TABLA Y ESTILOS
            # =========================================================================
            
            def obtener_estilo_etiqueta_puntaje(puntaje):
                if puntaje >= 0.9:
                    return {'background-color': '#dc2626', 'color': '#ffffff', 'border': '1.5px solid #dc2626', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '52px', 'height': '22px', 'border-radius': '4px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif puntaje >= 0.75:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #ef4444', 'color': '#dc2626', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '52px', 'height': '22px', 'border-radius': '4px', 'font-weight': '700', 'font-size': '0.75rem'}
                elif puntaje >= 0.5:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #f87171', 'color': '#b91c1c', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '52px', 'height': '22px', 'border-radius': '4px', 'font-weight': '700', 'font-size': '0.75rem'}
                else:
                    return {'background-color': '#ffffff', 'border': '1.5px solid #fee2e2', 'color': '#ef4444', 'display': 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'width': '52px', 'height': '22px', 'border-radius': '4px', 'font-weight': '700', 'font-size': '0.75rem'}

            # --- Tabla 1: Top Oportunidades Analíticas ---
            cabecera_tabla_analitica = [
                html.Tr([
                    html.Th("Unidad", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
                    html.Th("Distribuidor", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
                    html.Th("Puntaje Oportunidad", style={'text-align': 'center', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'}),
                    html.Th("Retraso", style={'text-align': 'left', 'padding': '12px 10px', 'font-weight': '600', 'color': '#475569', 'border-bottom': '2px solid #e2e8f0', 'background-color': '#f8fafc'})
                ])
            ]
            filas_tabla_analitica = []
            for _, row in tabla_top_10.iterrows():
                delay_val = row['avg_delay_vs_service_interval']
                texto_retraso = f"{int(delay_val)} horas" if not pd.isnull(delay_val) else "0 horas"
                filas_tabla_analitica.append(html.Tr([
                    html.Td(row['ALIAS'], style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '600', 'color': '#1e293b'}),
                    html.Td(row['DISTRIBUIDOR'] if not pd.isnull(row['DISTRIBUIDOR']) else 'Desconocido', style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'color': '#475569'}),
                    html.Td(html.Span(f"{row['puntaje_oportunidad']:.2f}", style=obtener_estilo_etiqueta_puntaje(row['puntaje_oportunidad'])), style={'text-align': 'center', 'padding': '10px', 'border-bottom': '1px solid #f1f5f9'}),
                    html.Td(texto_retraso, style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'color': '#475569'})
                ]))

            # ================================================
            # RETORNO DEL DISEÑO CON PESTAÑAS (TABS)
            # ================================================
            
            return html.Div([
                dcc.Tabs(id="tabs-monetizacion", value='tab-analitico', children=[
                    # Pestaña 1: Análisis de Oportunidades
                    dcc.Tab(label='Análisis de Oportunidades', value='tab-analitico', style={
                        'padding': '12px 24px', 'font-family': 'Outfit, sans-serif', 'font-weight': '600', 'border': 'none',
                        'background-color': '#f1f5f9', 'color': '#475569', 'border-radius': '6px 6px 0 0', 'margin-right': '4px'
                    }, selected_style={
                        'padding': '12px 24px', 'font-family': 'Outfit, sans-serif', 'font-weight': '700', 'border': 'none',
                        'background-color': '#ffffff', 'color': '#1e3a8a', 'border-bottom': '4px solid #1d4ed8', 'border-radius': '6px 6px 0 0', 'margin-right': '4px'
                    }, children=[
                        html.Div([
                            # Fila 1: Tabla y Gráfico de barras horizontales
                            html.Div([
                                # Izquierda: Tarjeta de tabla
                                html.Div([
                                    html.H3("Tabla de Prioridad Comercial", 
                                        style={'font-size': '1.125rem', 
                                            'font-weight': '700', 
                                            'color': '#10123C', 
                                            'margin-top': '0', 
                                            'margin-bottom': '16px', 
                                            'font-family': 'Outfit, sans-serif'}),
                                    html.Table(cabecera_tabla_analitica + filas_tabla_analitica, 
                                        style={
                                        'width': '100%', 
                                        'border-collapse': 'collapse', 
                                        'font-family': 'Inter, sans-serif',
                                        'font-size': '0.75rem'})
                                ], style={
                                    'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px 16px',
                                    'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                                    'flex': '1', 'min-width': '380px', 'overflow-x': 'auto'
                                }),
                                
                                # Derecha: Tarjeta de gráfico de barras
                                html.Div([
                                    html.H3("Unidades con Mayor Oportunidad de Monetización", 
                                        style={
                                            'font-size': '1.125rem', 
                                            'font-weight': '700', 
                                            'color': '#10123C', 
                                            'margin-top': '0', 
                                            'margin-bottom': '16px', 
                                            'font-family': 'Outfit, sans-serif'}),
                                    dcc.Graph(figure=figura_barras_oportunidad, config={'displayModeBar': False})
                                ], style={
                                    'background-color': '#ffffff', 
                                    'border-radius': '12px', 'padding': '24px',
                                    'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                                    'flex': '1', 'min-width': '380px'
                                })
                            ], style={
                                'display': 'flex', 
                                'gap': '24px', 
                                'margin-top': '20px',
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
                        ])
                    ]),

                    # Pestaña 2: Predicción Comercial (XGBoost)
                    dcc.Tab(label='Predicción Comercial', value='tab-predictivo', style={
                        'padding': '12px 24px', 'font-family': 'Outfit, sans-serif', 'font-weight': '600', 'border': 'none',
                        'background-color': '#f1f5f9', 'color': '#475569', 'border-radius': '6px 6px 0 0', 'margin-right': '4px'
                    }, selected_style={
                        'padding': '12px 24px', 'font-family': 'Outfit, sans-serif', 'font-weight': '700', 'border': 'none',
                        'background-color': '#ffffff', 'color': '#1e3a8a', 'border-bottom': '4px solid #1d4ed8', 'border-radius': '6px 6px 0 0', 'margin-right': '4px'
                    }, children=[
                        html.Div([
                            

                            # Fila 1: Tabla de Predicción
                            html.Div([
                                # Izquierda: Tabla de Predicción Comercial
                                html.Div([
                                    html.H3("Tabla de Predicción Comercial",
                                            style={
                                                'font-size': '1.125rem', 
                                                'font-weight': '700', 
                                                'color': '#10123C', 
                                                'margin-top': '0', 
                                                'margin-bottom': '16px', 
                                                'font-family': 'Outfit, sans-serif'
                                                }),
                                    # Filtro
                                    html.Div([
                                        html.Label("Filtrar por Probabilidad Mínima:", style={'font-weight': '600', 'margin-right': '10px', 'color': '#475569', 'font-size': '0.85rem'}),
                                        dcc.Dropdown(
                                            id='filtro-prob-monetizacion',
                                            options=[
                                                {'label': 'Mostrar todas', 'value': 0.0},
                                                {'label': '≥ 50%', 'value': 0.50},
                                                {'label': '≥ 70%', 'value': 0.70},
                                                {'label': '≥ 80%', 'value': 0.80},
                                                {'label': '≥ 90%', 'value': 0.90},
                                            ],
                                            value=0.0,
                                            clearable=False,
                                            style={'width': '150px', 'font-family': 'Outfit, sans-serif'}
                                        )
                                    ], style={'display': 'flex', 'align-items': 'center', 'margin-bottom': '15px'}),
                                    
                                    # Contenedor dinámico de la tabla
                                    html.Div(id='tabla-prediccion-container')
                                ], style={
                                    'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px 16px',
                                    'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                                    'flex': '1.2', 'min-width': '380px', 'overflow-x': 'auto'
                                }),
                                
                            ], style={'display': 'flex', 'gap': '24px', 'margin-bottom': '24px', 'flex-wrap': 'wrap'}),

                            # Fila 2: Predicción de Riesgo de Retraso de Servicios
                            html.Div([
                                html.Div([
                                    html.H3("Mantenimientos Pendientes con Mayor Riesgo de Quedar Inconclusos / Retrasados", 
                                        style={
                                            'font-size': '1.125rem',    
                                            'font-weight': '700', 
                                            'color': '#10123C', 
                                            'margin-top': '0', 
                                            'margin-bottom': '8px', 
                                            'font-family': 'Outfit, sans-serif'
                                            }),
                                    html.P("Servicios activos que tienen mayor probabilidad de quedar estancados en un estatus 'Pendiente' o 'CerradaFuera'.", 
                                        style={ 
                                            'font-size': '0.85rem', 
                                            'color': '#64748b', 
                                            'margin-bottom': '16px'
                                            }),
                                    # Filtro
                                    html.Div([
                                        html.Label("Filtrar por Probabilidad Mínima:", style={'font-weight': '600', 'margin-right': '10px', 'color': '#475569', 'font-size': '0.85rem'}),
                                        dcc.Dropdown(
                                            id='filtro-prob-retraso',
                                            options=[
                                                {'label': 'Mostrar todas', 'value': 0.0},
                                                {'label': '≥ 50%', 'value': 0.50},
                                                {'label': '≥ 70%', 'value': 0.70},
                                                {'label': '≥ 80%', 'value': 0.80},
                                                {'label': '≥ 90%', 'value': 0.90},
                                            ],
                                            value=0.0,
                                            clearable=False,
                                            style={'width': '150px', 'font-family': 'Outfit, sans-serif'}
                                        )
                                    ], style={'display': 'flex', 'align-items': 'center', 'margin-bottom': '15px'}),
                                    
                                    # Contenedor dinámico de la tabla
                                    html.Div(id='tabla-servicios-container')
                                ], style={
                                    'background-color': '#ffffff', 'border-radius': '12px', 'padding': '24px 16px',
                                    'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)', 'border': '1px solid #e5e7eb',
                                    'flex': '1', 'min-width': '380px', 'overflow-x': 'auto'
                                })
                            ], style={'display': 'flex', 'gap': '24px', 'flex-wrap': 'wrap'})
                        ])
                    ])
                ], style={'font-family': 'Outfit, sans-serif', 'font-size': '0.9rem'})
            ], style={'padding': '16px 0px', 'background-color': '#f8fafc', 'min-height': '100vh', 'font-family': 'Outfit, sans-serif'})

        except Exception as error_proceso:
            import traceback
            traceback.print_exc()
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

    # Registro de callbacks para actualizar las tablas basadas en filtros
    @aplicacion_dash.callback(
        Output('tabla-prediccion-container', 'children'),
        Input('filtro-prob-monetizacion', 'value')
    )
    def actualizar_tabla_monetizacion(prob_minima):
        global _CACHE_MONETIZACION
        if not _CACHE_MONETIZACION or 'df_monetizacion_final' not in _CACHE_MONETIZACION:
            return html.Div("Cargando...", style={'padding': '20px', 'color': '#64748b'})
            
        df = _CACHE_MONETIZACION['df_monetizacion_final']
        
        # Filtrar por la probabilidad mínima seleccionada y ordenar por valor de aftermarket
        df_filtrado = df[df['y_pred_proba_monetization'] >= float(prob_minima)]
        df_filtrado = df_filtrado.sort_values(by='valor_acumulado_aftermarket', ascending=False).head(10)
        
        filas = []
        for _, row in df_filtrado.iterrows():
            val_aft = row['valor_acumulado_aftermarket']
            texto_aft = f"${val_aft:,.2f}" if not pd.isnull(val_aft) else "$0.00"
            prob = row['y_pred_proba_monetization']
            filas.append(html.Tr([
                html.Td(row['ALIAS'], style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '600', 'color': '#1e293b'}),
                html.Td(row['DISTRIBUIDOR'] if not pd.isnull(row['DISTRIBUIDOR']) else 'Desconocido', style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'color': '#475569'}),
                html.Td(texto_aft, style={'text-align': 'right', 'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '600', 'color': '#0f172a'}),
                html.Td(html.Span(f"{prob * 100:.1f}%", style=obtener_estilo_badge_probabilidad(prob)), style={'text-align': 'center', 'padding': '10px', 'border-bottom': '1px solid #f1f5f9'})
            ]))
            
        if not filas:
            return html.Table(cabecera_tabla_prediccion + [
                html.Tr([
                    html.Td("No hay unidades que cumplan con el criterio seleccionado.", colSpan=4, style={'text-align': 'center', 'padding': '20px', 'color': '#64748b'})
                ])
            ], style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Inter, sans-serif', 'font-size': '0.75rem'})
            
        return html.Table(cabecera_tabla_prediccion + filas, style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Inter, sans-serif', 'font-size': '0.75rem'})

    @aplicacion_dash.callback(
        Output('tabla-servicios-container', 'children'),
        Input('filtro-prob-retraso', 'value')
    )
    def actualizar_tabla_servicios(prob_minima):
        global _CACHE_MONETIZACION
        if not _CACHE_MONETIZACION or 'df_mantenimientos_activos' not in _CACHE_MONETIZACION:
            return html.Div("Cargando...", style={'padding': '20px', 'color': '#64748b'})
            
        df = _CACHE_MONETIZACION['df_mantenimientos_activos']
        
        if df.empty:
            return html.Table(cabecera_tabla_servicios + [
                html.Tr([
                    html.Td("No hay mantenimientos activos pendientes de analizar.", colSpan=5, style={'text-align': 'center', 'padding': '20px', 'color': '#64748b'})
                ])
            ], style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Inter, sans-serif', 'font-size': '0.75rem'})
            
        # Filtrar por probabilidad mínima y ordenar por retraso vs intervalo de servicio
        df_filtrado = df[df['prob_retraso'] >= float(prob_minima)]
        df_filtrado = df_filtrado.sort_values(by='delay_vs_service_interval', ascending=False).head(10)
        
        filas = []
        for _, row in df_filtrado.iterrows():
            prob = row['prob_retraso']
            filas.append(html.Tr([
                html.Td(row['ID_MANTENIMIENTO'] if 'ID_MANTENIMIENTO' in row else f"SRV-{row.name}", style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'font-weight': '600', 'color': '#1e293b'}),
                html.Td(row['ALIAS'], style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'color': '#475569'}),
                html.Td(html.Span(row['ESTATUS'], style={'padding': '3px 8px', 'background-color': '#f1f5f9', 'border-radius': '4px', 'font-size': '0.75rem', 'font-weight': '600', 'color': '#475569'}), style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9'}),
                html.Td(row['DISTRIBUIDOR'] if not pd.isnull(row['DISTRIBUIDOR']) else 'Desconocido', style={'padding': '10px', 'border-bottom': '1px solid #f1f5f9', 'color': '#475569'}),
                html.Td(html.Span(f"{prob * 100:.1f}%", style=obtener_estilo_badge_probabilidad(prob)), style={'text-align': 'center', 'padding': '10px', 'border-bottom': '1px solid #f1f5f9'})
            ]))
            
        if not filas:
            return html.Table(cabecera_tabla_servicios + [
                html.Tr([
                    html.Td("No hay mantenimientos activos que cumplan con el criterio seleccionado.", colSpan=5, style={'text-align': 'center', 'padding': '20px', 'color': '#64748b'})
                ])
            ], style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Inter, sans-serif', 'font-size': '0.75rem'})
            
        return html.Table(cabecera_tabla_servicios + filas, style={'width': '100%', 'border-collapse': 'collapse', 'font-family': 'Inter, sans-serif', 'font-size': '0.75rem'})

    aplicacion_dash.layout = servir_diseno_dashboard
    return aplicacion_dash

init_monetizacion = inicializar_monetizacion
