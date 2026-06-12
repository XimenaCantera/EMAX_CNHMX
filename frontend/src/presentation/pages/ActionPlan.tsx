import React, { useState } from 'react';
import styles from './ActionPlan.module.css';
import financialData from '../../data/financialModel.json';

const initialPlanData = [
  {
    title: 'Plan de 3 meses',
    tasks: [
      { text: 'Análisis inicial de datos de mantenimiento.', completed: true },
      { text: 'Configuración de modelos predictivos básicos.', completed: true },
      { text: 'Presentación de resultados preliminares a stakeholders.', completed: false },
    ],
  },
  {
    title: 'Plan de 6 meses',
    tasks: [
      { text: 'Optimización de modelos de riesgo de intervención técnica.', completed: false },
      { text: 'Desarrollo de prototipo de dashboard interactivo.', completed: true },
      { text: 'Validación de estrategias de monetización con equipos.', completed: true },
      { text: 'Implementación de sistemas de alertas para unidades críticas.', completed: false },
    ],
  },
  {
    title: 'Plan de 9 meses',
    tasks: [
      { text: 'Interacción de modelos en sistemas operativos existentes.', completed: false },
      { text: 'Monitoreo y ajuste continuo de performance del modelo.', completed: true },
      { text: 'Generación de reportes de impacto y ROI.', completed: true },
      { text: 'Capacitación de modelos en sistemas operativos existentes.', completed: false },
      { text: 'Planificación de próximas fases del proyecto.', completed: true },
    ],
  },
];

export const ActionPlan: React.FC = () => {
  const [plans, setPlans] = useState(initialPlanData);

  // Buscar datos financieros
  const impactRow = financialData.find(r => r.Concepto?.includes('Total de impacto'));
  const investmentRow = financialData.find(r => r.Concepto?.includes('Inversión Inicial'));
  const roiRow = financialData.find(r => r.Concepto?.includes('Retorno de Inversión'));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Marcar / desmarcar una tarea por su índice de plan y de tarea
  const toggleTask = (planIndex: number, taskIndex: number) => {
    const newPlans = [...plans];
    newPlans[planIndex].tasks[taskIndex].completed = !newPlans[planIndex].tasks[taskIndex].completed;
    setPlans(newPlans);
  };

  // Calcular el progreso del plan
  const getProgress = (tasks: { completed: boolean }[]) => {
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100) || 0;
  };

  return (
    <div className={styles.container}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Avance para Plan de Acción</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '6px' }}>
          Este plan muestra las acciones de mantenimientos preventivos programadas a 3, 6 y 9 meses.
        </p>
      </div>

      {/* KPIs Financieros */}
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <h3>Impacto Total (9 meses)</h3>
          <p className={styles.kpiValue}>
            {formatCurrency(impactRow?.EscenarioMinimo as number)}
            <span className={styles.kpiSub}> ~ {formatCurrency(impactRow?.EscenarioMaximo as number)}</span>
          </p>
          <p className={styles.kpiDesc}>Escenario Conservador ~ Optimista</p>
        </div>

        <div className={styles.kpiCard}>
          <h3>Inversión Inicial</h3>
          <p className={styles.kpiValue}>
            {formatCurrency(investmentRow?.EscenarioMaximo as number)}
            <span className={styles.kpiSub}> ~ Hasta {formatCurrency(investmentRow?.EscenarioMinimo as number)}</span>
          </p>
          <p className={styles.kpiDesc}>CAPEX / OPEX Estimado</p>
        </div>

        <div className={styles.kpiCard}>
          <h3>ROI Proyectado</h3>
          <p className={styles.kpiValue}>
            {((roiRow?.EscenarioMinimo as number) || 0).toFixed(2)}%
            <span className={styles.kpiSub}> ~ {((roiRow?.EscenarioMaximo as number) || 0).toFixed(2)}%</span>
          </p>
          <p className={styles.kpiDesc}>Retorno sobre la Inversión</p>
        </div>
      </div>

      {/* Listas y Progreso de los Planes */}
      <div className={styles.cardsContainer}>
        {plans.map((plan, planIdx) => {
          const progress = getProgress(plan.tasks);

          return (
            <div key={planIdx} className={`card ${styles.planCard}`}>
              <div className={styles.leftSection}>
                <h2 className={styles.planTitle}>{plan.title}</h2>
                <ul className={styles.taskList}>
                  {plan.tasks.map((task, taskIdx) => (
                    <li key={taskIdx} className={styles.taskItem}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(planIdx, taskIdx)}
                        className={styles.checkbox}
                      />
                      <span className={styles.taskText}>{task.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.rightSection}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressText}>Progreso: {progress}%</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarBackground}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
                    >
                      <div className={styles.progressKnob}></div>
                    </div>
                    <div className={styles.progressDot} style={{ left: '25%' }}></div>
                    <div className={styles.progressDot} style={{ left: '50%' }}></div>
                    <div className={styles.progressDot} style={{ left: '75%' }}></div>
                    <div className={styles.progressDot} style={{ left: '100%' }}></div>
                  </div>
                  <div className={styles.progressLabels}>
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
