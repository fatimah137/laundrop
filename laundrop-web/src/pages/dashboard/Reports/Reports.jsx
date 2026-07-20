import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { Download, TrendingUp, ShoppingBag, Users, Wallet } from 'lucide-react';
import api from '../../../services/api';
import EmptyState from '../../../components/shared/EmptyState';
import Toast from '../../../components/shared/Toast';
import './Reports.css';

const formatIDR = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val || 0));

const WEEKDAY_LABELS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_LABELS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const TINT = {
  success: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  primary: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  info: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
};

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

export default function Reports() {
  const [range, setRange] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedRange, setAppliedRange] = useState({ start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState({ revenue: 0, orders: 0, avg_order: 0, top_service: '-' });
  const [series, setSeries] = useState([]);

  const showToast = (msg, type = 'danger') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = { range };
      if (appliedRange.start_date && appliedRange.end_date) {
        params.start_date = appliedRange.start_date;
        params.end_date = appliedRange.end_date;
      }

      const response = await api.get('/admin/reports', { params });
      const data = response?.data?.data ?? {};
      setSummary(data.summary ?? { revenue: 0, orders: 0, avg_order: 0, top_service: '-' });
      setSeries(Array.isArray(data.series) ? data.series : []);
    } catch (error) {
      setSummary({ revenue: 0, orders: 0, avg_order: 0, top_service: '-' });
      setSeries([]);
      showToast(error?.response?.data?.message || 'Gagal memuat data report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, appliedRange]);

  const hasCustomRange = Boolean(appliedRange.start_date && appliedRange.end_date);

  const chartData = useMemo(() => {
    return series.map((row) => {
      const date = new Date(row.date);
      const isValidDate = Number.isFinite(date.getTime());
      let label = row.date;

      if (isValidDate) {
        if (range === 'monthly' || hasCustomRange) {
          label = `${String(date.getDate()).padStart(2, '0')} ${MONTH_LABELS_ID[date.getMonth()]}`;
        } else {
          label = WEEKDAY_LABELS_ID[date.getDay()];
        }
      }

      return {
        name: label,
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0),
      };
    });
  }, [series, range, hasCustomRange]);

  const applyCustomRange = () => {
    if (!startDate || !endDate) {
      showToast('Isi start date dan end date terlebih dahulu');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      showToast('End date tidak boleh lebih kecil dari start date');
      return;
    }

    setAppliedRange({ start_date: startDate, end_date: endDate });
  };

  const clearCustomRange = () => {
    setStartDate('');
    setEndDate('');
    setAppliedRange({ start_date: '', end_date: '' });
  };

  const handleExport = async () => {
    try {
      const params = { range };
      if (appliedRange.start_date && appliedRange.end_date) {
        params.start_date = appliedRange.start_date;
        params.end_date = appliedRange.end_date;
      }

      const response = await api.get('/admin/reports/export', {
        params,
        responseType: 'blob',
      });

      const contentType = response?.headers?.['content-type'] || 'text/csv';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reports-${range}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal export report');
    }
  };

  return (
    <div className="reports-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

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
          <input
            type="date"
            className="reports-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="reports-date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button type="button" className="reports-apply-btn" onClick={applyCustomRange}>
            Apply
          </button>
          {hasCustomRange && (
            <button type="button" className="reports-clear-btn" onClick={clearCustomRange}>
              Clear
            </button>
          )}
          <button className="reports-export-btn" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="reports-stats-grid">
        <StatCard label="Revenue" value={formatIDR(summary.revenue)} icon={Wallet} tint="success" />
        <StatCard label="Orders" value={summary.orders || 0} icon={ShoppingBag} tint="primary" />
        <StatCard label="Rata-rata" value={formatIDR(summary.avg_order)} icon={TrendingUp} tint="info" />
        <StatCard label="Top Service" value={summary.top_service || '-'} icon={Users} tint="warning" />
      </div>

      {loading ? (
        <EmptyState title="Loading reports..." />
      ) : chartData.length === 0 ? (
        <EmptyState title="Belum ada data report" description="Data akan muncul setelah ada transaksi dan pembayaran." />
      ) : (
        <div className="reports-charts-grid">
          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Revenue Trend</h3>
            <div className="reports-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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

          <div className="reports-chart-card">
            <h3 className="reports-chart-title">Orders Per Day</h3>
            <div className="reports-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
      )}
    </div>
  );
}
