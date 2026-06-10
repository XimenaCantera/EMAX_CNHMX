
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './presentation/components/layout/MainLayout';
import { Dashboard } from './presentation/pages/Dashboard';
import { Monetization } from './presentation/pages/Monetization';
import { Distributors } from './presentation/pages/Distributors';
import { UnitDetail } from './presentation/pages/UnitDetail';
import { FugaServicios } from './presentation/pages/FugaServicios';
import { RiesgoOperativo } from './presentation/pages/RiesgoOperativo';
import { PlanMeses } from './presentation/pages/PlanMeses';
import { ImportPage } from './presentation/pages/ImportPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="monetization" element={<Monetization />} />
          <Route path="distributors" element={<Distributors />} />
          <Route path="unit" element={<UnitDetail />} />
          <Route path="fuga-servicios" element={<FugaServicios />} />
          <Route path="riesgo-operativo" element={<RiesgoOperativo />} />
          <Route path="plan-meses" element={<PlanMeses />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
