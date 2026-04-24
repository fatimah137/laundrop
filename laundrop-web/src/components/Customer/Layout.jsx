// src/components/Customer/Layout.jsx
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar'; // Satu folder
import Header from './Header';   // Satu folder
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="main-wrapper">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;