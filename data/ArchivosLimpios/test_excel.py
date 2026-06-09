import pandas as pd

path = r'c:\Users\emili\OneDrive\Documentos\Tareas Tec\6to Semestre\REPOSITORIO\EMAX_CNHMX\data\ArchivosLimpios\new_mantenimientos.xlsx'
df = pd.read_excel(path)

# Crear 500 filas falsas con un estatus llamativo
df_fake = df.head(500).copy()
df_fake['DISTRIBUIDOR'] = 'DISTRIBUIDOR_DE_PRUEBA_EMAX'
df_fake['ESTATUS'] = 'Pendiente'
df_fake['HRMTRO'] = 0
df_fake['ACTUAL'] = 10000 # Retraso enorme

df_combined = pd.concat([df_fake, df])
df_combined.to_excel(path, index=False)
print("Se añadieron 500 registros falsos con distribuidor 'DISTRIBUIDOR_DE_PRUEBA_EMAX'.")
