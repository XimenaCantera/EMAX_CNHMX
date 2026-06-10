import React from 'react';
import { Search, Bell, Settings, UserCircle } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Industrial Dashboard', subtitle }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h2>{title}</h2>
        {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} className="text-muted" />
          <input type="text" placeholder="Buscar unidades..." />
        </div>
        
        <div className="header-actions">
          <button className="icon-btn">
            <Bell size={20} />
          </button>
          <button className="icon-btn">
            <Settings size={20} />
          </button>
          <button className="icon-btn">
            <UserCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
