import { useState, useEffect } from 'react';
import { ShoppingBag, Wallet, Users, Clock } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { formatIDR } from '../../../data/format';
import PageHeader from '../../../components/shared/PageHeader';
import StatCard from '../../../components/shared/StatCard';
import RevenueChart from '../../../components/Dashboard/OwnerDashboard/RevenueChart';
import StatusBreakdown from '../../../components/Dashboard/OwnerDashboard/StatusBreakdown';
import RecentOrdersTable from '../../../components/Dashboard/OwnerDashboard/RecentOrdersTable';
import api from '../../../services/api';
import './OwnerDashboard.css';

export default function OwnerDashboard() {
  const { role, currentUser } = useRole();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const welcomeSubtitle = {
    owner:    'Berikut ringkasan hari ini.',
    employee: 'Berikut tugas hari ini.',
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>Selamat Datang, {currentUser?.name} 👋</h1>
        <p style={{ marginBottom: '24px' }}>{welcomeSubtitle[role]}</p>
        <p style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
          Memuat data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Selamat Datang, {currentUser?.name} 👋</h1>
        <p style={{ marginBottom: '24px' }}>{welcomeSubtitle[role]}</p>
        <p style={{ textAlign: 'center', marginTop: '40px', color: '#d32f2f' }}>
          {error}
        </p>
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={fetchDashboardStats}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1>Selamat Datang, {currentUser?.name} 👋</h1>
        <p style={{ marginBottom: '24px' }}>{welcomeSubtitle[role]}</p>
        <p style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
          Tidak ada data tersedia
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Selamat Datang, {currentUser?.name} 👋</h1>
      <p style={{ marginBottom: '24px' }}>{welcomeSubtitle[role]}</p>

      <div className="stats-grid">
        <StatCard
          label="Total Pesanan"
          value={stats.total_orders}
          icon={ShoppingBag}
          tint="primary"
          trend="+12%"
        />
        <StatCard
          label="Pendapatan"
          value={formatIDR(stats.total_revenue)}
          icon={Wallet}
          tint="success"
          trend="+8%"
        />
        <StatCard
          label="Pelanggan"
          value={stats.total_customers}
          icon={Users}
          tint="info"
          trend="+3%"
        />
        <StatCard
          label="Pesanan Aktif"
          value={stats.active_orders}
          icon={Clock}
          tint="warning"
          trend={`${stats.pending_payments} belum bayar`}
          trendDir={stats.pending_payments > 0 ? 'down' : 'up'}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-main">
          <RevenueChart data={stats.revenue_by_date} />
        </div>
        <div className="chart-side">
          <StatusBreakdown data={stats.status_breakdown} />
        </div>
      </div>

      <div className="table-container">
        <RecentOrdersTable orders={stats.recent_orders} />
      </div>
    </div>
  );
}