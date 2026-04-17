import './StatCard.css';
export default function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-icon-wrapper">
        <Icon size={20} />
      </div>
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
    </div>
  );
}