import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getStatusConfig } from '../../../data/statusConfig';
import './StatusBreakdown.css';

export default function StatusBreakdown({ orders = [] }) {
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(statusCounts).map(key => {
    const cfg = getStatusConfig(key);
    return {
      name:  cfg.label,
      value: statusCounts[key],
      color: cfg.color,
    };
  });

  if (data.length === 0) {
    return (
      <div className="status-card">
        <h3 className="status-title">Status Breakdown</h3>
        <div className="empty-chart">Belum ada data pesanan</div>
      </div>
    );
  }

  return (
    <div className="status-card">
      <h3 className="status-title">Status Breakdown</h3>
      <p className="status-subtitle">Distribusi status pesanan saat ini</p>

      <div className="chart-layout">
        <div className="pie-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={35}
                outerRadius={65}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="legend-list">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <div className="legend-info">
                <div className="status-dot" style={{ backgroundColor: item.color }} />
                <span className="status-name">{item.name}</span>
              </div>
              <span className="status-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}