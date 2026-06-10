import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Users, Tractor, Upload, UserCircle } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: <Home size={20} />, label: 'Inicio' },
  { path: '/monetization', icon: <DollarSign size={20} />, label: 'Monetización' },
  { path: '/distributors', icon: <Users size={20} />, label: 'Distribuidores' },
  { path: '/unit', icon: <Tractor size={20} />, label: 'Unidad' },
  { path: '/import', icon: <Upload size={20} />, label: 'Importar' },
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
