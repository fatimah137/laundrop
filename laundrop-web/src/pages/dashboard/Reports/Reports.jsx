import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {MOCK_ORDERS} from '../../../data/mockData';
import { Download, TrendingUp, ShoppingBag, Users, Wallet } from 'lucide-react';
import './Reports.css';

// ─── Helper ───────────────────────────────────────────────────
const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const TINT = {
  success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  primary: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  info:    { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

// ─── StatCard ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, tint = 'primary' }) {
  const t = TINT[tint];
  return (
    <div className="reports-stat-card">
      <div className="reports-stat-icon" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
        <Icon size={20} color={t.color} />
      </div>
      <div>
        <p className="reports-stat-label">{label}</p>
        <p className="reports-stat-value">{value}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function Reports() {
  const [range, setRange] = useState('weekly');
  const orders = MOCK_ORDERS; // ganti dengan fetch API saat data real tersedia
  const { days, totalRev, totalOrders, avgOrder, topService } = useMemo(() => {
    const buckets = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
    const arr = [];

    for (let i = buckets - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('id-ID',
        buckets <= 7
          ? { weekday: 'short' }
          : { day: '2-digit', month: 'short' }
      );
      const dayOrders = orders.filter(o => o.pickup_date === key);
      arr.push({
        name: label,
        revenue: dayOrders
          .filter(o => o.payment_status === 'paid')
          .reduce((s, o) => s + (o.total_amount || 0), 0),
        orders: dayOrders.length,
      });
    }

    const totalRev     = arr.reduce((s, a) => s + a.revenue, 0);
    const totalOrders  = arr.reduce((s, a) => s + a.orders, 0);
    const avgOrder     = totalOrders > 0 ? totalRev / totalOrders : 0;

    const serviceCounts = {};
    orders.forEach(o => {
      serviceCounts[o.service_name] = (serviceCounts[o.service_name] || 0) + 1;
    });
    const topService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { days: arr, totalRev, totalOrders, avgOrder, topService };
  }, [orders, range]);

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Reports & Analytics</h1>
          <p className="reports-subtitle">Business insights at a glance.</p>
        </div>
        <div className="reports-header-actions">
          <select
            className="reports-select"
            value={range}
            onChange={e => setRange(e.target.value)}
          >
            <option value="daily">Hari Ini</option>
            <option value="weekly">7 Hari Terakhir</option>
            <option value="monthly">30 Hari Terakhir</option>
          </select>
          <button
            className="reports-export-btn"
            onClick={() => alert('Fitur export belum tersedia')}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="reports-stats-grid">
        <StatCard label="Revenue"     value={formatIDR(totalRev)}  icon={Wallet}     tint="success" />
        <StatCard label="Orders"      value={totalOrders}           icon={ShoppingBag} tint="primary" />
        <StatCard label="Rata-rata"   value={formatIDR(avgOrder)}  icon={TrendingUp}  tint="info"    />
        <StatCard label="Top Service" value={topService}            icon={Users}       tint="warning" />
      </div>

      {/* Charts */}
      <div className="reports-charts-grid">
        {/* Revenue Trend */}
        <div className="reports-chart-card">
          <h3 className="reports-chart-title">Revenue Trend</h3>
          <div className="reports-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={v => formatIDR(v)}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Per Day */}
        <div className="reports-chart-card">
          <h3 className="reports-chart-title">Orders Per Day</h3>
          <div className="reports-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}