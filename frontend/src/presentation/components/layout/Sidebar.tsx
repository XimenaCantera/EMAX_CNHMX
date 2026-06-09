import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PenTool, AlertTriangle, CircleDollarSign, Users, ClipboardList, Download, UserCircle } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: <Home size={24} />, label: 'Inicio' },
  { path: '/fuga-servicios', icon: <PenTool size={24} />, label: 'Fuga de servicios' },
  { path: '/riesgo-operativo', icon: <AlertTriangle size={24} />, label: 'Riesgo operativo' },
  { path: '/monetization', icon: <CircleDollarSign size={24} />, label: 'Monetización' },
  { path: '/distributors', icon: <Users size={24} />, label: 'Distribuidores' },
  { path: '/action-plan', icon: <ClipboardList size={24} />, label: 'Plan a meses' },
  { path: '/import', icon: <Download size={24} />, label: 'Importar datos' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>CNH<br />Industrial</h1>
        <p className="sidebar-subtitle">Control Panel</p>
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
          <UserCircle size={32} />
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-status">Session Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
