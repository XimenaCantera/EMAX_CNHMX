import React, { useState } from 'react';
import styles from './ActionPlan.module.css';
import financialData from '../../data/financialModel.json';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface PlanSection {
  title: string;
  tasks: Task[];
}

const initialPlanData: PlanSection[] = [
  {
    title: 'Plan de 3 meses',
    tasks: [
      { id: 't1', text: 'Análisis inicial de datos de mantenimiento.', completed: true },
      { id: 't2', text: 'Configuración de modelos predictivos básicos.', completed: true },
      { id: 't3', text: 'Presentación de resultados preliminares a stakeholders.', completed: false },
    ],
  },
  {
    title: 'Plan de 6 meses',
    tasks: [
      { id: 't4', text: 'Optimización de modelos de riesgo de intervención técnica.', completed: false },
      { id: 't5', text: 'Desarrollo de prototipo de dashboard interactivo.', completed: true },
      { id: 't6', text: 'Validación de estrategias de monetización con equipos.', completed: true },
      { id: 't7', text: 'Implementación de sistemas de alertas para unidades críticas.', completed: false },
    ],
  },
  {
    title: 'Plan de 9 meses',
    tasks: [
      { id: 't8', text: 'Interacción de modelos en sistemas operativos existentes.', completed: false },
      { id: 't9', text: 'Monitoreo y ajuste continuo de performance del modelo.', completed: true },
      { id: 't10', text: 'Generación de reportes de impacto y ROI.', completed: true },
      { id: 't11', text: 'Capacitación de modelos en sistemas operativos existentes.', completed: false },
      { id: 't12', text: 'Planificación de próximas fases del proyecto.', completed: true },
    ],
  },
];

export const ActionPlan: React.FC = () => {
  const [plans, setPlans] = useState<PlanSection[]>(initialPlanData);


  const impactRow = financialData.find(r => typeof r.Concepto === 'string' && r.Concepto.includes('Total de impacto en 9 meses'));
  const investmentRow = financialData.find(r => typeof r.Concepto === 'string' && r.Concepto.includes('Inversión Inicial Estimada'));
  const roiRow = financialData.find(r => typeof r.Concepto === 'string' && r.Concepto.includes('Retorno de Inversión'));

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const toggleTask = (planIndex: number, taskId: string) => {
    setPlans(prevPlans => {
      const newPlans = [...prevPlans];
      const plan = { ...newPlans[planIndex] };
      const tasks = plan.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      plan.tasks = tasks;
      newPlans[planIndex] = plan;
      return newPlans;
    });
  };

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Avance para Plan de Acción</h1>

      {/* Sección de KPIs Financieros */}
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <h3>Impacto Total (9 meses)</h3>
          <p className={styles.kpiValue}>
            {impactRow ? formatCurrency(impactRow.EscenarioMinimo as number) : '$0.00'}
            <span className={styles.kpiSub}> ~ {impactRow ? formatCurrency(impactRow.EscenarioMaximo as number) : '$0.00'}</span>
          </p>
          <p className={styles.kpiDesc}>Escenario Conservador ~ Optimista</p>
        </div>

        <div className={styles.kpiCard}>
          <h3>Inversión Inicial</h3>
          <p className={styles.kpiValue}>
            {investmentRow ? formatCurrency(investmentRow.EscenarioMaximo as number) : '$0.00'}
            <span className={styles.kpiSub}> ~ Hasta {investmentRow ? formatCurrency(investmentRow.EscenarioMinimo as number) : '$0.00'}</span>
          </p>
          <p className={styles.kpiDesc}>CAPEX / OPEX Estimado</p>
        </div>

        <div className={styles.kpiCard}>
          <h3>ROI Proyectado</h3>
          <p className={styles.kpiValue}>
            {roiRow ? (roiRow.EscenarioMinimo as number).toFixed(2) : '0.00'}%
            <span className={styles.kpiSub}> ~ {roiRow ? (roiRow.EscenarioMaximo as number).toFixed(2) : '0.00'}%</span>
          </p>
          <p className={styles.kpiDesc}>Retorno sobre la Inversión</p>
        </div>
      </div>

      <div className={styles.cardsContainer}>
        {plans.map((plan, index) => {
          const progress = calculateProgress(plan.tasks);

          return (
            <div key={index} className={`card ${styles.planCard}`}>
              <div className={styles.leftSection}>
                <h2 className={styles.planTitle}>{plan.title}</h2>
                <ul className={styles.taskList}>
                  {plan.tasks.map(task => (
                    <li key={task.id} className={styles.taskItem}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(index, task.id)}
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
                    {/* Puntos visuales al 25%, 50%, 75% en el fondo para imitar el diseño */}
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
