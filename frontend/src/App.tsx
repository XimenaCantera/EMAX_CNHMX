
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './presentation/components/layout/MainLayout';
import { Dashboard } from './presentation/pages/Dashboard';
import { Monetization } from './presentation/pages/Monetization';
import { Distributors } from './presentation/pages/Distributors';
import { UnitDetail } from './presentation/pages/UnitDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="monetization" element={<Monetization />} />
          <Route path="distributors" element={<Distributors />} />
          <Route path="unit" element={<UnitDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
