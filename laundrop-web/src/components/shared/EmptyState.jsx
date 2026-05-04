import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.css'; 

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No data yet', 
  description, 
  action 
}) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon-wrapper">
        <Icon className="empty-state-icon" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && (
        <div className="empty-state-action">{action}</div>
      )}
    </div>
  );
}