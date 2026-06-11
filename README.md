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

* **React.js, TypeScript y Vite**: Escogimos estas tecnologías ya que nos permiten desarrollar una interfaz de usuario modular, rápida y ofrece una experiencia interactiva óptima.
* **Flask (Python)**: Muestra un micro-framework ágil para usar los endpoints REST y conectar la interfaz con la lógica facilmente.
* **Dash y Plotly**: Decidimos utilizarlo para generar visualizaciones dinámicas dentro del backend.
* **Pandas y NumPy**: Son herramientas básicas en ciencia de datos para poder cargar, limpiezar, fusionar datos y procesar archivos Excel de forma eficiente.
* **Modelos Predictivos (XGBoost, Regresión Lineal Múltiple, ANOVA)**: Decidimos implementar estos modelos por su solidez para modelar relaciones de fallos, estimar comportamientos de fuga y proyectar tendencias de amortización/monetización, consideramos que nos ayuda demostrar patrones o como ayuda para que CNH pueda tomar la mejor decisión.

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