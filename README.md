# EMAX - CNH Plataforma de analítica

Plataforma analítica e interactiva diseñada para CNH Industrial México, orientada a la predicción de fallas operativas, optimización de aftermarket, identificación de fuga de servicios a servicios externos y planificación financiera de mantenimiento.

### Desarrollado por el equipo EMAX:
* José Emiliano Díaz Gutiérrez
* Ximena Cantera Reséndiz
* María Fernanda Barba De Los Santos


## Características Principales
- **Importación Inteligente de Datos**: Carga dinámica de archivos Excel.
- **Validación Avanzada**: Validación en tiempo real del nombre del archivo y verificación de las columnas de datos antes de su procesamiento.
- **Fusión Acumulativa**: Los nuevos archivos Excel importados se combinan automáticamente y se deduplican (manteniendo los registros más recientes) con los datos del servidor sin sobrescribir el historial.
- **Tableros Predictivos e Interactivos (Dash/Plotly)**:
  - **Fuga de Servicios**: Identificación de unidades que realizan mantenimientos fuera de la red de distribuidores autorizados.
  - **Riesgo Operativo**: Medición del riesgo de fallo y retraso operativo en las unidades basados en severidad y horas acumuladas.
  - **Monetización**: Cálculo del impacto económico potencial, costos de refacciones y estimación de ROI a 3, 6 y 9 meses.

---

## Tecnologías Utilizadas
* **Frontend**: React.js, TypeScript, Vite, CSS moderno.
* **Backend**: Flask (Python), Flask-CORS, Pandas, NumPy, Dash, Plotly.
* **Modelos Predictivos**: XGBoost, Regresión Lineal Múltiple, ANOVA Robusto, Z-Test.
* **Base de Datos**: Archivos Excel estructurados en `data/ArchivosLimpios/`.

---

## Arquitectura del Proyecto

```text
EMAX_CNHMX/
├── app/                  # Servidor backend de Flask, lógica analítica y apps de Dash
├── data/                 # Almacenamiento de bases de datos (originales y limpias)
├── frontend/             # Código fuente de la interfaz de usuario en React
├── notebooks/            # Cuadernos Jupyter para modelado y experimentación
└── requirements.txt      # Archivo raíz de dependencias de Python
```

---

## Justificación de las Tecnologías Usadas

Aprendimos a usar **Dash y Plotly** para hacer gráficos interactivos y análisis de datos en Python. Pero para este proyecto quisimos diseñar una plataforma completa, secciones separadas (Dashboard, Fuga de Servicios, Importador de archivos) y un diseño personalizado que fuera fácil de navegar.

Por eso decidimos combinar las siguientes herramientas:

* **Dash y Plotly**: Los usamos para programar todos los gráficos interactivos y cálculos del negocio. De esta forma, aprovechamos al máximo lo que aprendimos para la visualización de datos.
* **Flask**: Es un micro-framework en Python muy sencillo que nos sirve como "puente". Nos permite correr los modelos y levantar los tableros de Dash en segundo plano.
* **React, HTML y CSS**: Se decidió no hacer toda la página en Python  porque consideramos que puede ser más complicado para personalizar el diseño y acomodar los elementos de los tableros, usamos React y HTML básico para armar la plantilla del dashboard. Dentro de esta plantilla agregamos los gráficos interactivos de Dash.

## Tecnologías y Herramientas Usadas
* **Visualizaciones**: Dash y Plotly en Python.
* **Procesamiento de datos**: Pandas y NumPy (para cargar, limpiar y fusionar los datos de Excel).
* **Modelado y Análisis**: XGBoost, Regresión Lineal y pruebas estadísticas.
* **Servidor (Backend)**: Flask en Python.
* **Interfaz de usuario (Frontend)**: React, HTML y CSS para estructurar la navegación.

---

## Justificación del Enfoque de Predicción

* **Predicción de Fuga de Servicios**: Empleamos un análisis temporal y estadístico del historial de servicios para identificar comportamientos atípicos. Si una unidad pasa un lapso de tiempo o de horas superior al umbral predictivo sin registrar servicios en CNH MX, se clasifica como fuga potencial hacia lugares externos.
* **Estimación de Riesgo Operativo**: Se usa un enfoque de clasificación supervisada basado en variables del motor/unidades (como horas acumuladas y severidad de incidentes) para calcular la probabilidad de que una máquina falle a corto o mediano plazo.
* **Proyección Financiera y ROI**: La implementación de regresión lineal múltiple junto con matrices financieras nos ayudan a proyectar a 3, 6 y 9 meses la recuperación monetaria al retener clientes en servicios de mantenimiento dentro de la red, facilitando la toma de decisiones estratégicas.

---

## Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/XimenaCantera/EMAX_CNHMX.git
   cd EMAX_CNHMX
   ```

2. **Ejecutar el Servidor Backend (Flask)**
   Instala las dependencias raíz y corre el script:
   ```bash
   pip install -r requirements.txt
   python app/app.py
   ```
   *El servidor backend correrá en `http://127.0.0.1:5000`.*

3. **Ejecutar la Aplicación Frontend (React)**
   Abre otra terminal, colócate en el directorio `frontend` e instala las dependencias de Node:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *La aplicación frontend estará disponible en `http://localhost:5173`.*

---