import './StatCard.css';

export default function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="customer-stat-card">
      <div className={`customer-stat-icon ${colorClass}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="customer-stat-info">
        <p className="customer-stat-label">{label}</p>
        <p className="customer-stat-value">{value}</p>
      </div>
    </div>
  );
}