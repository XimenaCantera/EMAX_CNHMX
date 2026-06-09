import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Wrench, AlertTriangle, DollarSign, Users, ClipboardList, Upload } from 'lucide-react';
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
          <span className="cnh-text">CNH</span>
          <span className="industrial-text">INDUSTRIAL</span>
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

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar-circle">AD</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-status">Sesión Activa</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
