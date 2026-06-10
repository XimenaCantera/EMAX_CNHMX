import os
import pandas as pd
import numpy as np
import time
import threading

_CACHE_DASHBOARD = None
_CACHE_LOCK = threading.Lock()

def limpiar_cache():
    global _CACHE_DASHBOARD
    with _CACHE_LOCK:
        _CACHE_DASHBOARD = None

def obtener_data_internal(directorio_archivos_limpios, forzar_actualizacion=False):
    tiempo_inicio = time.time()

    ruta_mantenimientos = f"{directorio_archivos_limpios}/new_mantenimientos.xlsx"
    ruta_unidades = f"{directorio_archivos_limpios}/new_unidades.xlsx"
        
    # Cargar los datos
    # Solo necesitamos estos dos archivos según las reglas
    mantenimientos = pd.read_excel(ruta_mantenimientos)
    unidades = pd.read_excel(ruta_unidades)
    
    # Validar si las columnas existen, si no, crear con 0 para no tronar
    if 'Pendientes' not in unidades.columns:
        unidades['Pendientes'] = 0
    if 'C.Fuera' not in unidades.columns:
        unidades['C.Fuera'] = 0
        
    # Limpiar columnas: asegurar que sean números y rellenar vacíos con 0
    unidades['Pendientes'] = pd.to_numeric(unidades['Pendientes'], errors='coerce').fillna(0)
    unidades['C.Fuera'] = pd.to_numeric(unidades['C.Fuera'], errors='coerce').fillna(0)
    
    # Columna auxiliar base pedida
    unidades['servicios_oportunidad'] = unidades['Pendientes'] + unidades['C.Fuera']

    # --- 1. Card: Servicios en oportunidad ---
    # Estatus permitidos
    estatus_oportunidad = ['Pendiente', 'PorVencer', 'EnProceso', 'Abierta']
    if 'ESTATUS' in mantenimientos.columns:
        oportunidades_activas = int(mantenimientos['ESTATUS'].isin(estatus_oportunidad).sum())
    else:
        oportunidades_activas = 0

    # --- 2. Card: Próximos servicios 30 días ---
    if 'ESTATUS' in mantenimientos.columns:
        proximos_servicios = int((mantenimientos['ESTATUS'] == 'PorVencer').sum())
    else:
        proximos_servicios = 0

    # --- 3. Card: Unidades con alta carga de oportunidad ---
    unidades_alta_carga = int((unidades['servicios_oportunidad'] > 7).sum())

    # --- (Extra) Valor potencial global ---
    valor_potencial = oportunidades_activas * 3500

    # --- 4. Dona: Urgencia de servicios ---
    # Leer específicamente del archivo en data/archivos_compañia/
    import glob
    directorio_base = os.path.dirname(directorio_archivos_limpios)
    directorio_compania = os.path.join(directorio_base, 'archivos_compañia')
    archivos_riesgo = glob.glob(os.path.join(directorio_compania, 'tabla_riesg*.xlsx'))
    
    if archivos_riesgo:
        ruta_riesgo = archivos_riesgo[0]
        try:
            df_riesgo = pd.read_excel(ruta_riesgo, sheet_name='Tabla_Riesgo_Final')
            
            # Contar según la columna solicitada
            if 'Nivel de riesgo' in df_riesgo.columns:
                conteos_riesgo = df_riesgo['Nivel de riesgo'].value_counts()
                conteo_critico = int(conteos_riesgo.get('Crítico', 0))
                conteo_alto = int(conteos_riesgo.get('Alto', 0))
                conteo_medio = int(conteos_riesgo.get('Medio', 0))
                conteo_bajo = int(conteos_riesgo.get('Bajo', 0))
            else:
                conteo_critico, conteo_alto, conteo_medio, conteo_bajo = 0, 0, 0, 0
                
            total_unidades_grafica = conteo_critico + conteo_alto + conteo_medio + conteo_bajo
            
            # Imprimir logs solicitados
            print("Dona riesgo basada en archivo de riesgo filtrado")
            print(f"Total unidades: {total_unidades_grafica}")
            print(f"Crítico: {conteo_critico}, Alto: {conteo_alto}, Medio: {conteo_medio}, Bajo: {conteo_bajo}")
            
        except Exception as e:
            print(f"Error leyendo el archivo de riesgo: {e}")
            conteo_critico, conteo_alto, conteo_medio, conteo_bajo = 0, 0, 0, 0
            total_unidades_grafica = 0
    else:
        print("No se encontró el archivo de tabla de riesgo en archivos_compañia.")
        conteo_critico, conteo_alto, conteo_medio, conteo_bajo = 0, 0, 0, 0
        total_unidades_grafica = 0
    if total_unidades_grafica > 0:
        porcentaje_critico = round((conteo_critico / total_unidades_grafica) * 100, 1)
        porcentaje_alto = round((conteo_alto / total_unidades_grafica) * 100, 1)
        porcentaje_medio = round((conteo_medio / total_unidades_grafica) * 100, 1)
        porcentaje_bajo = round((conteo_bajo / total_unidades_grafica) * 100, 1)
    else:
        porcentaje_critico, porcentaje_alto, porcentaje_medio, porcentaje_bajo = 0.0, 0.0, 0.0, 0.0

    # --- 5. Tabla: Top servicios con mayor oportunidad ---
    unidades['potencial'] = unidades['servicios_oportunidad'] * 3500
    mejores_unidades = unidades.sort_values(by='potencial', ascending=False).head(5)
    
    top_oportunidades = []
    for _, fila in mejores_unidades.iterrows():
        # Calcular categoría de urgencia
        so = fila['servicios_oportunidad']
        if so >= 20:
            estado = 'Crítico'
        elif so >= 10:
            estado = 'Alto'
        elif so >= 5:
            estado = 'Medio'
        else:
            estado = 'Bajo'
            
        # Formatear el nombre de la unidad
        alias_unidad = str(fila.get('Alias', 'Sin Alias'))
        distribuidor = str(fila.get('Distribuidor', 'Sin Distribuidor'))
        
        # Como el Alias ya trae el nombre del distribuidor integrado en muchos casos (ej. "ENAGRI - NH10100M"),
        # separamos por " - " y tomamos la última parte para que quede solo el número o clave.
        if ' - ' in alias_unidad:
            unidad_mostrar = alias_unidad.split(' - ')[-1].strip()
        else:
            unidad_mostrar = alias_unidad
            
        top_oportunidades.append({
            'unidad': unidad_mostrar,
            'distribuidor': distribuidor if pd.notna(fila.get('Distribuidor')) else '',
            'estado': estado,
            'proximo_servicio': 'Oportunidad activa', # Texto estático solicitado
            'potencial': fila['potencial'],
            'servicios_cnt': int(so)
        })

    # --- Validaciones por consola ---
    print("\n=== RESUMEN CÁLCULOS DASHBOARD ===")
    print(f"Total servicios en oportunidad: {oportunidades_activas}")
    print(f"Total próximos servicios: {proximos_servicios}")
    print(f"Total unidades con alta carga de oportunidad: {unidades_alta_carga}")
    print(f"Conteo urgencia -> Crítico: {conteo_critico}, Alto: {conteo_alto}, Medio: {conteo_medio}, Bajo: {conteo_bajo}")
    print("Top 5 unidades por potencial:")
    for t in top_oportunidades:
        print(f" - {t['unidad']}: {t['servicios_cnt']} servicios -> ${t['potencial']:,.2f}")

    # --- 6. Mapa Interactivo y Nota Ejecutiva ---
    import plotly.express as px
    
    html_mapa = ""
    nota_ejecutiva = "No hay suficientes datos para generar la recomendación de foco."
    
    if archivos_riesgo and 'df_riesgo' in locals():
        # Columnas seguras (con .get para evitar errores si falta alguna)
        cols_riesgo = ["Alias", "Nivel de riesgo", "Score riesgo", "Pendientes", "Cerrada fuera", "Backlog", "Atraso máx hrs", "Horómetro"]
        cols_riesgo_existentes = [c for c in cols_riesgo if c in df_riesgo.columns]
        df_riesgo_base = df_riesgo[cols_riesgo_existentes].copy()
        
        cols_ub = ["Alias", "Latitud", "Longitud", "Ciudad", "Estado", "Distribuidor"]
        cols_ub_existentes = [c for c in cols_ub if c in unidades.columns]
        df_ubicacion = unidades[cols_ub_existentes].copy()
        
        df_mapa = df_riesgo_base.merge(df_ubicacion, on="Alias", how="left")
        
        if "Latitud" in df_mapa.columns and "Longitud" in df_mapa.columns:
            df_mapa["Latitud"] = pd.to_numeric(df_mapa["Latitud"], errors="coerce")
            df_mapa["Longitud"] = pd.to_numeric(df_mapa["Longitud"], errors="coerce")
            df_mapa = df_mapa.dropna(subset=["Latitud", "Longitud"])
            df_mapa = df_mapa[(df_mapa["Latitud"] != 0) & (df_mapa["Longitud"] != 0)]
            
            print(f"Unidades de riesgo con ubicación válida: {len(df_mapa)}")
            
            # Agrupación requerida
            mapa_agrupado = df_mapa.groupby(
                ["Estado", "Ciudad", "Distribuidor", "Latitud", "Longitud", "Nivel de riesgo"],
                dropna=False
            ).agg(
                unidades=("Alias", "count"),
                pendientes=("Pendientes", "sum") if "Pendientes" in df_mapa.columns else ("Alias", lambda x: 0),
                cerrada_fuera=("Cerrada fuera", "sum") if "Cerrada fuera" in df_mapa.columns else ("Alias", lambda x: 0),
                backlog=("Backlog", "sum") if "Backlog" in df_mapa.columns else ("Alias", lambda x: 0),
                score_promedio=("Score riesgo", "mean") if "Score riesgo" in df_mapa.columns else ("Alias", lambda x: 0),
                atraso_maximo=("Atraso máx hrs", "max") if "Atraso máx hrs" in df_mapa.columns else ("Alias", lambda x: 0)
            ).reset_index()
            
            mapa_agrupado["servicios_oportunidad"] = mapa_agrupado["pendientes"] + mapa_agrupado["cerrada_fuera"]
            
            # Filtrar críticos y altos
            niveles_prioritarios = ["Crítico", "Alto"]
            mapa_prioritario = mapa_agrupado[mapa_agrupado["Nivel de riesgo"].astype(str).str.strip().isin(niveles_prioritarios)].copy()
            
            print(f"Total de unidades Crítico + Alto graficadas: {mapa_prioritario['unidades'].sum()}")
            
            # Crear figura
            colores_riesgo = {"Crítico": "#20235C", "Alto": "#B45309"}
            fig = px.scatter_mapbox(
                mapa_prioritario,
                lat="Latitud",
                lon="Longitud",
                size="unidades",
                color="Nivel de riesgo",
                color_discrete_map=colores_riesgo,
                category_orders={"Nivel de riesgo": ["Crítico", "Alto"]},
                hover_name="Ciudad",
                hover_data={
                    "Estado": True, "Distribuidor": True, "Nivel de riesgo": True,
                    "unidades": True, "pendientes": True, "cerrada_fuera": True,
                    "servicios_oportunidad": True, "backlog": True,
                    "score_promedio": ":.1f", "atraso_maximo": True,
                    "Latitud": False, "Longitud": False
                },
                zoom=4.7,
                center={"lat": 23.6345, "lon": -102.5528},
                mapbox_style="carto-positron",
                title="Concentración geográfica de unidades críticas y altas",
                height=700
            )
            fig.update_traces(marker=dict(opacity=0.9))
            fig.update_layout(
                paper_bgcolor="#F9FAFB", plot_bgcolor="#FFFFFF",
                font=dict(family="Arial", size=14, color="#111827"),
                title=dict(font=dict(size=22, color="#111827"), x=0.02),
                legend=dict(
                    title="Nivel de riesgo", bgcolor="#FFFFFF", bordercolor="#E5E7EB",
                    borderwidth=1, font=dict(color="#111827")
                ),
                margin={"r":20, "t":60, "l":20, "b":20}
            )
            
            html_mapa = fig.to_html(full_html=False, include_plotlyjs='cdn')
            
        # Nota Ejecutiva
        if "Estado" in df_riesgo.columns and "Nivel de riesgo" in df_riesgo.columns:
            df_prioritario = df_riesgo[df_riesgo["Nivel de riesgo"].astype(str).str.strip().isin(niveles_prioritarios)].copy()
            top_estados = df_prioritario.groupby("Estado").agg(
                unidades_prioritarias=("Nivel de riesgo", "size"),
                criticas=("Nivel de riesgo", lambda x: (x == "Crítico").sum()),
                altas=("Nivel de riesgo", lambda x: (x == "Alto").sum()),
                pendientes=("Pendientes", "sum") if "Pendientes" in df_prioritario.columns else ("Nivel de riesgo", lambda x: 0),
                cerrada_fuera=("Cerrada fuera", "sum") if "Cerrada fuera" in df_prioritario.columns else ("Nivel de riesgo", lambda x: 0)
            ).reset_index()
            
            top_estados["servicios_oportunidad"] = top_estados["pendientes"] + top_estados["cerrada_fuera"]
            top_3 = top_estados.sort_values(by=["unidades_prioritarias", "criticas", "servicios_oportunidad"], ascending=False).head(3)
            
            lista_estados = top_3["Estado"].tolist()
            if len(lista_estados) > 0:
                print(f"Top estados recomendados: {lista_estados}")
                if len(lista_estados) == 3:
                    texto_estados = f"{lista_estados[0]}, {lista_estados[1]} y {lista_estados[2]}"
                else:
                    texto_estados = ", ".join(lista_estados)
                
                nota_ejecutiva = f"Foco recomendado: {texto_estados}. Estos estados concentran la mayor carga de unidades críticas y altas, por lo que representan la mejor zona inicial para activar seguimiento técnico, contacto con distribuidores y recuperación de servicios."

        # Calcular top 5 ciudades desde df_mapa si existe (porque tiene la columna Ciudad)
        top_5_ciudades = []
        if 'df_mapa' in locals() and "Ciudad" in df_mapa.columns and "Estado" in df_mapa.columns:
            df_mapa_prioritario = df_mapa[df_mapa["Nivel de riesgo"].astype(str).str.strip().isin(niveles_prioritarios)].copy()
            
            # Filtramos ciudades desconocidas
            df_mapa_prioritario = df_mapa_prioritario[
                df_mapa_prioritario["Ciudad"].notna() &
                (df_mapa_prioritario["Ciudad"].astype(str).str.strip().str.lower() != "desconocido")
            ]
            
            if not df_mapa_prioritario.empty:
                top_ciudades = df_mapa_prioritario.groupby(["Ciudad", "Estado"]).agg(
                    unidades_prioritarias=("Alias", "count"),
                    criticas=("Nivel de riesgo", lambda x: (x == "Crítico").sum()),
                    altas=("Nivel de riesgo", lambda x: (x == "Alto").sum()),
                    pendientes=("Pendientes", "sum") if "Pendientes" in df_mapa_prioritario.columns else ("Alias", lambda x: 0),
                    cerrada_fuera=("Cerrada fuera", "sum") if "Cerrada fuera" in df_mapa_prioritario.columns else ("Alias", lambda x: 0)
                ).reset_index()
                
                top_ciudades["servicios_oportunidad"] = top_ciudades["pendientes"] + top_ciudades["cerrada_fuera"]
                top_ciudades = top_ciudades.sort_values(
                    by=["unidades_prioritarias", "criticas", "servicios_oportunidad"], 
                    ascending=False
                ).head(5)
                
                # Convertir a dict
                for _, row in top_ciudades.iterrows():
                    top_5_ciudades.append({
                        "Ciudad": str(row["Ciudad"]),
                        "Estado": str(row["Estado"]),
                        "unidades_prioritarias": int(row["unidades_prioritarias"]),
                        "criticas": int(row["criticas"]),
                        "altas": int(row["altas"]),
                        "servicios_oportunidad": int(row["servicios_oportunidad"])
                    })

    print("==================================\n")
    
    global _CACHE_MAPA
    _CACHE_MAPA = html_mapa

    # Textos de recomendaciones
    rec_dist_desc = f"Se detectaron unidades con alta carga de servicios que requieren atención prioritaria."
    rec_pendientes_desc = f"{oportunidades_activas} servicios en oportunidad requieren seguimiento por parte de los distribuidores."
    rec_prices_desc = f"Existen {oportunidades_activas} oportunidades activas de seguimiento aftermarket."

    _CACHE_DASHBOARD = {
        'oportunidades_activas': oportunidades_activas,
        'unidades_alta_carga': unidades_alta_carga,
        'valor_potencial': valor_potencial,
        'proximos_servicios': proximos_servicios,
        'top_oportunidades': top_oportunidades,
        'donut_chart_data': {
            'critico_pct': porcentaje_critico,
            'critico_cnt': conteo_critico,
            'alto_pct': porcentaje_alto,
            'alto_cnt': conteo_alto,
            'medio_pct': porcentaje_medio,
            'medio_cnt': conteo_medio,
            'bajo_pct': porcentaje_bajo,
            'bajo_cnt': conteo_bajo
        },
        'recomendaciones': {
            'distribuidores_desc': rec_dist_desc,
            'pendientes_desc': rec_pendientes_desc,
            'aftermarket_desc': rec_prices_desc,
            'nota_ejecutiva': nota_ejecutiva,
            'top_5_ciudades': top_5_ciudades
        }
    }
    
    tiempo_fin = time.time()
    print(f"[LOG] Tiempo de procesamiento interno: {tiempo_fin - tiempo_inicio:.2f} segundos")
    return _CACHE_DASHBOARD

def obtener_data(directorio_archivos_limpios, forzar_actualizacion=False):
    global _CACHE_DASHBOARD
    
    with _CACHE_LOCK:
        if not forzar_actualizacion and _CACHE_DASHBOARD is not None:
            return _CACHE_DASHBOARD
            
        resultado = obtener_data_internal(directorio_archivos_limpios, forzar_actualizacion)
        _CACHE_DASHBOARD = resultado
        return resultado
def obtener_datos_distribuidores(directorio_archivos_limpios):
    ruta_mantenimientos = f"{directorio_archivos_limpios}/new_mantenimientos.xlsx"
    
    try:
        mantenimientos = pd.read_excel(ruta_mantenimientos)
    except Exception:
        mantenimientos = pd.DataFrame()

    def buscar_columna(df, opciones):
        cols_lower = {c.lower().strip(): c for c in df.columns}
        for opc in opciones:
            if opc.lower().strip() in cols_lower:
                return cols_lower[opc.lower().strip()]
        return None

    if mantenimientos.empty:
        return {
            'total_distribuidores': 0,
            'pendientes_por_atender': 0,
            'unidades_alerta_roja': 0,
            'top_distribuidores': [],
            'lista_unidades': []
        }

    col_dist_mant = buscar_columna(mantenimientos, ['DISTRIBUIDOR', 'Distribuidor'])
    col_estatus_mant = buscar_columna(mantenimientos, ['ESTATUS', 'Estatus'])
    col_alias_mant = buscar_columna(mantenimientos, ['ALIAS', 'Alias', 'Unidad'])
    col_actual = buscar_columna(mantenimientos, ['ACTUAL', 'Actual'])
    col_hrmtro = buscar_columna(mantenimientos, ['HRMTRO', 'Hrmtro'])
    col_servicio = buscar_columna(mantenimientos, ['SERVICIO', 'Servicio'])

    total_distribuidores = int(mantenimientos[col_dist_mant].nunique()) if col_dist_mant else 0
    
    if col_estatus_mant:
        estatus_norm = mantenimientos[col_estatus_mant].astype(str).str.strip().str.title()
        pendientes_por_atender = int(estatus_norm.isin(['Pendiente']).sum())
    else:
        pendientes_por_atender = 0

    unidades_alerta_roja = 0
    top_distribuidores = []
    lista_unidades = []

    if col_estatus_mant and col_alias_mant and col_dist_mant and col_actual and col_hrmtro and col_servicio:
        status_risk_mapping = {'Cerrada': 0, 'PorVencer': 1, 'EnProceso': 1, 'Abierta': 1, 'Pendiente': 2, 'CerradaFuera': 2}
        mantenimientos['ESTATUS_CLEAN'] = mantenimientos[col_estatus_mant].astype(str).str.strip()
        mantenimientos['overdue_risk'] = mantenimientos['ESTATUS_CLEAN'].map(status_risk_mapping).fillna(0)

        relevant_status = ['Pendiente', 'Cerrado', 'CerradaFuera']
        df_filtered_anova = mantenimientos[mantenimientos['ESTATUS_CLEAN'].isin(relevant_status)].copy()
        
        df_filtered_anova = df_filtered_anova.dropna(subset=[col_actual, col_hrmtro, col_servicio, 'ESTATUS_CLEAN'])
        
        df_filtered_anova['score_operativo'] = (
            pd.to_numeric(df_filtered_anova[col_actual], errors='coerce').fillna(0) +
            pd.to_numeric(df_filtered_anova[col_hrmtro], errors='coerce').fillna(0) +
            pd.to_numeric(df_filtered_anova[col_servicio], errors='coerce').fillna(0)
        ) / 3

        try:
            df_filtered_anova['SEVERITY_LEVEL'] = pd.qcut(
                df_filtered_anova['score_operativo'],
                q=3,
                labels=['Low', 'Medium', 'High'],
                duplicates='drop'
            )
        except Exception:
            df_filtered_anova['SEVERITY_LEVEL'] = 'Low'

        filtro_alerta = (
            (df_filtered_anova['ESTATUS_CLEAN'].isin(['Pendiente', 'CerradaFuera'])) &
            (df_filtered_anova['overdue_risk'] == 2.0) &
            (df_filtered_anova['SEVERITY_LEVEL'] == 'High')
        )
        red_alert_units = df_filtered_anova[filtro_alerta]

        unidades_alerta_roja = int(red_alert_units[col_alias_mant].nunique())

        red_alert_units_per_dist = red_alert_units.groupby(col_dist_mant)[col_alias_mant].nunique().reset_index()
        red_alert_units_per_dist.rename(columns={col_alias_mant: 'Unidades en Alerta Roja'}, inplace=True)

        total_units_per_dist = mantenimientos.groupby(col_dist_mant)[col_alias_mant].nunique().reset_index()
        total_units_per_dist.rename(columns={col_alias_mant: 'Total Unidades'}, inplace=True)

        red_alert_summary = pd.merge(red_alert_units_per_dist, total_units_per_dist, on=col_dist_mant, how='left')
        red_alert_summary['Porcentaje en Alerta Roja'] = (
            red_alert_summary['Unidades en Alerta Roja'] / red_alert_summary['Total Unidades']
        ) * 100

        red_alert_summary_sorted = red_alert_summary.sort_values(by='Unidades en Alerta Roja', ascending=False)

        for _, row in red_alert_summary_sorted.head(10).iterrows():
            top_distribuidores.append({
                'distribuidor': str(row[col_dist_mant]),
                'unidades_alerta_roja': int(row['Unidades en Alerta Roja']),
                'total_unidades': int(row['Total Unidades']),
                'porcentaje_alerta': float(row['Porcentaje en Alerta Roja'])
            })
        
        df_lista = df_filtered_anova.sort_values(by='ESTATUS_CLEAN', ascending=False).head(100)
        for _, fila in df_lista.iterrows():
            unidad = str(fila.get(col_alias_mant, 'Sin Unidad'))
            distribuidor = str(fila.get(col_dist_mant, 'Sin Distribuidor'))
            estatus = str(fila.get('ESTATUS_CLEAN', 'Sin Estatus'))
            riesgo = str(fila.get('SEVERITY_LEVEL', 'Normal'))
            
            horas_actuales = 0
            val = fila.get(col_actual, 0)
            if not pd.isna(val):
                try:
                    horas_actuales = float(val)
                except Exception:
                    pass
                
            lista_unidades.append({
                'unidad': unidad,
                'distribuidor': distribuidor,
                'estatus': estatus,
                'riesgo': riesgo,
                'horas_actuales': horas_actuales
            })

    return {
        'total_distribuidores': total_distribuidores,
        'pendientes_por_atender': pendientes_por_atender,
        'unidades_alerta_roja': unidades_alerta_roja,
        'top_distribuidores': top_distribuidores,
        'lista_unidades': lista_unidades
    }
