import { ShoppingBag, Wallet, Users, Clock } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { formatIDR } from '../../../data/format';
import { MOCK_ORDERS, MOCK_CUSTOMERS } from '../../../data/mockData';
import PageHeader from '../../../components/shared/PageHeader';
import StatCard from '../../../components/shared/StatCard';
import RevenueChart from '../../../components/Dashboard/OwnerDashboard/RevenueChart';
import StatusBreakdown from '../../../components/Dashboard/OwnerDashboard/StatusBreakdown';
import RecentOrdersTable from '../../../components/Dashboard/OwnerDashboard/RecentOrdersTable';
import './OwnerDashboard.css';

const ACTIVE_STATUSES = ['pending', 'pickup', 'diprocess', 'siap', 'dikirim'];

export default function OwnerDashboard() {
  const { role, currentUser } = useRole();

  const totalRevenue = MOCK_ORDERS
    .filter(o => o.payment_status === 'paid')
    .reduce((s, o) => s + (o.total_amount || 0), 0);

  const activeOrders = MOCK_ORDERS
    .filter(o => ACTIVE_STATUSES.includes(o.status)).length;

  const pendingPayments = MOCK_ORDERS
    .filter(o => o.payment_status === 'unpaid').length;

  return (
    <div className="dashboard-wrapper">
      <PageHeader
        title={`Selamat Datang, ${currentUser?.name?.split(' ')[0] || 'Admin'} 👋`}
        subtitle={`Masuk sebagai ${role || 'Owner'} — Berikut ringkasan hari ini.`}
      />

      <div className="stats-grid">
        <StatCard
          label="Total Pesanan"
          value={MOCK_ORDERS.length}
          icon={ShoppingBag}
          tint="primary"
          trend="+12%"
        />
        <StatCard
          label="Pendapatan"
          value={formatIDR(totalRevenue)}
          icon={Wallet}
          tint="success"
          trend="+8%"
        />
        <StatCard
          label="Pelanggan"
          value={MOCK_CUSTOMERS.length}
          icon={Users}
          tint="info"
          trend="+3%"
        />
        <StatCard
          label="Pesanan Aktif"
          value={activeOrders}
          icon={Clock}
          tint="warning"
          trend={`${pendingPayments} belum bayar`}
          trendDir={pendingPayments > 0 ? 'down' : 'up'}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-main">
          <RevenueChart orders={MOCK_ORDERS} />
        </div>
        <div className="chart-side">
          <StatusBreakdown orders={MOCK_ORDERS} />
        </div>
      </div>

      <div className="table-container">
        <RecentOrdersTable orders={MOCK_ORDERS} />
      </div>
    </div>
  );
}