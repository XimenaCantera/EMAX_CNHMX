import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wrench, AlertTriangle, DollarSign, Users, ClipboardList, Upload } from 'lucide-react';
import logoCnh from '../../../assets/logo_cnh.png';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: <Home size={20} />, label: 'Inicio' },
  { path: '/fuga-servicios', icon: <Wrench size={20} />, label: 'Fuga de servicios' },
  { path: '/riesgo-operativo', icon: <AlertTriangle size={20} />, label: 'Riesgo operativo' },
  { path: '/monetization', icon: <DollarSign size={20} />, label: 'Monetización' },
  { path: '/distributors', icon: <Users size={20} />, label: 'Distribuidores' },
  { path: '/plan-meses', icon: <ClipboardList size={20} />, label: 'Plan a meses' },
  { path: '/import', icon: <Upload size={20} />, label: 'Importar datos' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logoCnh} alt="CNH Industrial Logo" className="logo-img" />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
