import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="layout-content">
        <Header />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
