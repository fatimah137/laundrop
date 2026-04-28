import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './StatusBreakdown.css';

// Konfigurasi warna untuk tiap status laundry
const STATUS_COLORS = {
  proses: '#3b82f6',    // Biru
  siap: '#10b981',      // Hijau
  diambil: '#f59e0b',   // Oranye
  selesai: '#6366f1',   // Indigo
  cancelled: '#ef4444', // Merah
};

export default function StatusBreakdown({ orders = [] }) {
  // 1. Hitung jumlah pesanan per status
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'proses';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // 2. Format data untuk Recharts
  const data = Object.keys(statusCounts).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: statusCounts[key],
    color: STATUS_COLORS[key] || '#9ca3af'
  }));

  // Jika tidak ada data, tampilkan empty state sesuai CSS kamu
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
        {/* Pie Chart */}
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend List (Sesuai CSS kamu) */}
        <div className="legend-list">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <div className="legend-info">
                <div 
                  className="status-dot" 
                  style={{ backgroundColor: item.color }} 
                />
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