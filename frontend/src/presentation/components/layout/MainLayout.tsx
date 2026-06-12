import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-content">
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
