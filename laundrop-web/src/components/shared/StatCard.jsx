import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ label, value, icon: Icon, trend, trendDir = 'up', tint = 'primary' }) {
  return (
    <div className="stat-card">
      {/* Baris atas: label kiri, icon kanan */}
      <div className="stat-top-row">
        <p className="stat-label">{label}</p>
        {Icon && (
          <div className={`stat-icon-box stat-icon-${tint}`}>
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Value di bawah label */}
      <p className="stat-value">{value}</p>

      {/* Trend di paling bawah */}
      {trend && (
        <div className={`stat-trend ${trendDir === 'up' ? 'up' : 'down'}`}>
          {trendDir === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}