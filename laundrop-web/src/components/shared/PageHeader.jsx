import React from 'react';
import './PageHeader.css';

export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="header-text">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>
      {children && (
        <div className="header-actions">
          {children}
        </div>
      )}
    </div>
  );
}