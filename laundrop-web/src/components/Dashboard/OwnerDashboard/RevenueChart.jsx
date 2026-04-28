import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { formatIDR } from '../../../data/format';
import './RevenueChart.css';

export default function RevenueChart({ orders = [] }) {
  const data = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const revenue = orders
        .filter(o => o.pickup_date === key && o.payment_status === 'paid')
        .reduce((s, o) => s + (o.total_amount || 0), 0);
      days.push({ name: label, revenue });
    }
    return days;
  }, [orders]);

  return (
    <div className="rev-card">
      <div className="rev-header">
        <div>
          <h3 className="rev-title">Revenue Overview</h3>
          <p className="rev-subtitle">Last 7 days</p>
        </div>
      </div>
      <div className="rev-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={v => [formatIDR(v), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#rev-grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}