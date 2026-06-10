import os
import pandas as pd
import numpy as np

def obtener_data(clean_files_dir):
    ruta_mantenimientos = f"{clean_files_dir}/new_mantenimientos.xlsx"
    ruta_unidades = f"{clean_files_dir}/new_unidades.xlsx"
    ruta_population = f"{clean_files_dir}/new_population.xlsx"
        
    # Cargar los datos 
    mantenimientos = pd.read_excel(ruta_mantenimientos)
    unidades = pd.read_excel(ruta_unidades)
    
    population = None
    if os.path.exists(ruta_population):
        population = pd.read_excel(ruta_population)
            
    #Columnas auxiliares de retraso y riesgo 
    mantenimientos['retraso_servicio'] = mantenimientos['ACTUAL'] - mantenimientos['SERVICIO']
    mapa_riesgo_estatus = {
    'Cerrada': 0,
    'PorVencer': 1,
    'EnProceso': 1,
    'Abierta': 1,
    'Pendiente': 2,
    'CerradaFuera': 2
    }
    mantenimientos['riesgo_retraso'] = mantenimientos['ESTATUS'].map(mapa_riesgo_estatus).fillna(0)
    
    #Reparar datos para identificar unidades con mayor riesgo
    estatus = ['Pendiente', 'Cerrada', 'CerradaFuera']
    datos_filtrados = mantenimientos[mantenimientos['ESTATUS'].isin(estatus)].copy()
    datos_filtrados = datos_filtrados.dropna(subset=['ACTUAL', 'HRMTRO', 'SERVICIO', 'ESTATUS'])
    
    promedio_retraso = datos_filtrados['retraso_servicio'].mean()
    datos_filtrados['SEVERITY_LEVEL'] = 'Bajo'
    datos_filtrados.loc[
    datos_filtrados['retraso_servicio'] > promedio_retraso,
    'SEVERITY_LEVEL'
] = 'Alto'

    unidades_alerta = datos_filtrados[
    (datos_filtrados['ESTATUS'].isin(['Pendiente', 'CerradaFuera'])) &
    (datos_filtrados['riesgo_retraso'] == 2) &
    (datos_filtrados['SEVERITY_LEVEL'] == 'Alto')
]

    unidades_criticas = int(unidades_alerta['ALIAS'].nunique())

    #Oportunidades activas y próximos servicios
    oportunidades_activas = int(mantenimientos['ESTATUS'].isin([
    'Pendiente', 'PorVencer', 'EnProceso', 'Abierta'
    ]).sum())
    proximos_servicios = int((mantenimientos['ESTATUS'] == 'PorVencer').sum())

    #Valor potencial estimado en pesos mexicanos
    valor_potencial = oportunidades_activas * 3500

    #Frecuencia de servicios por unidad
    frecuencia_servicio_df = mantenimientos.groupby('ALIAS').size().reset_index(name='frecuencia_servicio')

    #Edad de los equipos
    datos_unidades = unidades[['Alias', 'Fecha Alta']].copy()
    datos_unidades = datos_unidades.rename(columns={'Alias': 'ALIAS'})

    datos_unidades['Fecha Alta'] = pd.to_datetime(datos_unidades['Fecha Alta'], errors='coerce')
    fecha_actual = pd.to_datetime('today')

    datos_unidades['edad_equipo'] = (
        (fecha_actual - datos_unidades['Fecha Alta']).dt.days / 365
    ).round(1)

    #Valor acumulado de aftermarket
    columnas_valor = ['Cerrados', 'C.Fuera', 'Pendientes']

    for columna in columnas_valor:
        unidades[columna] = pd.to_numeric(unidades[columna], errors='coerce')

    unidades['valor_aftermarket'] = unidades[columnas_valor].fillna(0).sum(axis=1)

    valor_aftermarket_df = unidades[['Alias', 'valor_aftermarket']].copy()
    valor_aftermarket_df = valor_aftermarket_df.rename(columns={'Alias': 'ALIAS'})

    #Riesgo promedio por unidad
    riesgo_df = mantenimientos.groupby('ALIAS')[['riesgo_retraso', 'retraso_servicio']].mean().reset_index()

    # Agregar distribuidor por unidad
    distribuidor_df = mantenimientos.groupby('ALIAS')['DISTRIBUIDOR'].first().reset_index()

    # Unir tablas para crear base de monetización
    datos_monetizacion = pd.merge(frecuencia_servicio_df, valor_aftermarket_df, on='ALIAS', how='left')
    datos_monetizacion = pd.merge(datos_monetizacion, datos_unidades[['ALIAS', 'edad_equipo']], on='ALIAS', how='left')
    datos_monetizacion = pd.merge(datos_monetizacion, riesgo_df, on='ALIAS', how='left')
    datos_monetizacion = pd.merge(datos_monetizacion, distribuidor_df, on='ALIAS', how='left')

    # Rellenar valores vacíos
    datos_monetizacion['riesgo_retraso'] = datos_monetizacion['riesgo_retraso'].fillna(0)
    datos_monetizacion['valor_aftermarket'] = datos_monetizacion['valor_aftermarket'].fillna(0)

    # Calcular score simple de oportunidad
    datos_monetizacion['score_oportunidad'] = (
        datos_monetizacion['riesgo_retraso'] * datos_monetizacion['valor_aftermarket']
    )

    # Filtrar y ordenar
    top_units = datos_monetizacion.sort_values(
        by='score_oportunidad',
        ascending=False
    ).head(5)

    # Calcular el TOP 5 de unidades con mayor oportunidad
    top_oportunidades = []

    for i, fila in top_units.iterrows():

        if fila['riesgo_retraso'] == 2:
            estado = 'Alto'
        elif fila['riesgo_retraso'] == 1:
            estado = 'Medio'
        else:
            estado = 'Bajo'

        if fila['retraso_servicio'] > 0:
            proximo_servicio = 'Vencido'
        else:
            proximo_servicio = 'Por vencer'

        top_oportunidades.append({
            'unidad': fila['ALIAS'],
            'distribuidor': fila['DISTRIBUIDOR'],
            'estado': estado,
            'proximo_servicio': proximo_servicio,
            'potencial': fila['valor_aftermarket']
        })
        
    #Porcentajes para la gráfica de urgencia
    total_unidades = len(datos_monetizacion)

    if total_unidades > 0:
        promedio_retraso = datos_monetizacion['retraso_servicio'].mean()

        critico_cnt = int((
        (datos_monetizacion['riesgo_retraso'] == 2) &
        (datos_monetizacion['retraso_servicio'] > promedio_retraso)
        ).sum())

        alto_cnt = int((
        (datos_monetizacion['riesgo_retraso'] == 2) &
        (datos_monetizacion['retraso_servicio'] <= promedio_retraso)
        ).sum())

        medio_cnt = int((datos_monetizacion['riesgo_retraso'] == 1).sum())
        bajo_cnt = int((datos_monetizacion['riesgo_retraso'] == 0).sum())

        critico_pct = round((critico_cnt / total_unidades) * 100, 1)
        alto_pct = round((alto_cnt / total_unidades) * 100, 1)
        medio_pct = round((medio_cnt / total_unidades) * 100, 1)
        bajo_pct = round((bajo_cnt / total_unidades) * 100, 1)
    else:
        critico_pct = 0.0
        alto_pct = 0.0
        medio_pct = 0.0
        bajo_pct = 0.0
        
    #Distribuidor con más unidades en alerta
    if len(unidades_alerta) > 0 and 'DISTRIBUIDOR' in unidades_alerta.columns:
        conteo_distribuidores = unidades_alerta['DISTRIBUIDOR'].value_counts()
    
        if len(conteo_distribuidores) > 0:
            distribuidor_principal = conteo_distribuidores.index[0]
            unidades_distribuidor = int(conteo_distribuidores.iloc[0])
        else:
            distribuidor_principal = 'Sin dato'
            unidades_distribuidor = 0
    else:
        distribuidor_principal = 'Sin dato'
        unidades_distribuidor = 0

    rec_dist_desc = (
        f"{unidades_distribuidor} unidades en {distribuidor_principal} "
        "presentan alerta por retraso en servicio preventivo."
    )

    # Unidades pendientes de atención
    pendientes_count = int((mantenimientos['ESTATUS'] == 'Pendiente').sum())

    rec_kits_desc = (
        f"{pendientes_count} servicios pendientes requieren seguimiento por parte de los distribuidores."
    )

    # Oportunidades activas
    rec_prices_desc = (
        f"Se detectaron {oportunidades_activas} oportunidades activas de seguimiento aftermarket."
    )
    
    rec_pendientes_desc = (
        f"{pendientes_count} servicios pendientes requieren seguimiento por parte de los distribuidores."
    )
    
    return {
        'oportunidades_activas': oportunidades_activas,
        'unidades_criticas': unidades_criticas,
        'valor_potencial': valor_potencial,
        'proximos_servicios': proximos_servicios,
        'top_oportunidades': top_oportunidades,
        'donut_chart_data': {
            'critico_pct': critico_pct,
            'alto_pct': alto_pct,
            'medio_pct': medio_pct,
            'bajo_pct': bajo_pct
        },
        'recomendaciones': {
            'distribuidores_desc': rec_dist_desc,
            'pendientes_desc': rec_pendientes_desc,
            'aftermarket_desc': rec_prices_desc
        }
    }