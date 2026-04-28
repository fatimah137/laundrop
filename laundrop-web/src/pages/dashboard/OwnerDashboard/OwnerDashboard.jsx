import { ShoppingBag, Wallet, Users, Clock } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { formatIDR } from '../../../data/format';
import PageHeader from '../../../components/shared/PageHeader';
import StatCard from '../../../components/shared/StatCard';
import RevenueChart from '../../../components/Dashboard/OwnerDashboard/RevenueChart';
import StatusBreakdown from '../../../components/Dashboard/OwnerDashboard/StatusBreakdown';
import RecentOrdersTable from '../../../components/Dashboard/OwnerDashboard/RecentOrdersTable';
import './OwnerDashboard.css';

// Helper tanggal
const getDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// Data dummy
const MOCK_ORDERS = [
  { id: 'ORD-001', customer_name: 'Budi Santoso',  service_name: 'Cuci + Setrika', status: 'proses',    payment_status: 'paid',   total_amount: 30000,  pickup_date: getDate(0), created_date: getDate(0) },
  { id: 'ORD-002', customer_name: 'Siti Aminah',   service_name: 'Express',        status: 'siap',      payment_status: 'unpaid', total_amount: 45000,  pickup_date: getDate(0), created_date: getDate(0) },
  { id: 'ORD-003', customer_name: 'Rudi Hartono',  service_name: 'Setrika Saja',   status: 'selesai',   payment_status: 'paid',   total_amount: 15000,  pickup_date: getDate(1), created_date: getDate(1) },
  { id: 'ORD-004', customer_name: 'Dewi Lestari',  service_name: 'Cuci Kering',    status: 'selesai',   payment_status: 'paid',   total_amount: 120000, pickup_date: getDate(1), created_date: getDate(1) },
  { id: 'ORD-005', customer_name: 'Ahmad Fauzi',   service_name: 'Cuci + Setrika', status: 'delivery',  payment_status: 'paid',   total_amount: 60000,  pickup_date: getDate(2), created_date: getDate(2) },
  { id: 'ORD-006', customer_name: 'Maya Sari',     service_name: 'Express',        status: 'cancelled', payment_status: 'unpaid', total_amount: 45000,  pickup_date: getDate(2), created_date: getDate(2) },
  { id: 'ORD-007', customer_name: 'Hendra Wijaya', service_name: 'Cuci Kering',    status: 'selesai',   payment_status: 'paid',   total_amount: 80000,  pickup_date: getDate(3), created_date: getDate(3) },
  { id: 'ORD-008', customer_name: 'Rina Kusuma',   service_name: 'Cuci + Setrika', status: 'selesai',   payment_status: 'paid',   total_amount: 30000,  pickup_date: getDate(3), created_date: getDate(3) },
  { id: 'ORD-009', customer_name: 'Fajar Nugroho', service_name: 'Setrika Saja',   status: 'selesai',   payment_status: 'paid',   total_amount: 20000,  pickup_date: getDate(3), created_date: getDate(3) },
  { id: 'ORD-010', customer_name: 'Lina Marlina',  service_name: 'Cuci + Setrika', status: 'selesai',   payment_status: 'paid',   total_amount: 45000,  pickup_date: getDate(4), created_date: getDate(4) },
  { id: 'ORD-011', customer_name: 'Bowo Santoso',  service_name: 'Express',        status: 'selesai',   payment_status: 'paid',   total_amount: 55000,  pickup_date: getDate(4), created_date: getDate(4) },
  { id: 'ORD-012', customer_name: 'Citra Dewi',    service_name: 'Cuci Kering',    status: 'selesai',   payment_status: 'paid',   total_amount: 160000, pickup_date: getDate(5), created_date: getDate(5) },
  { id: 'ORD-013', customer_name: 'Doni Prasetyo', service_name: 'Cuci + Setrika', status: 'selesai',   payment_status: 'paid',   total_amount: 30000,  pickup_date: getDate(5), created_date: getDate(5) },
  { id: 'ORD-014', customer_name: 'Eka Putri',     service_name: 'Setrika Saja',   status: 'selesai',   payment_status: 'paid',   total_amount: 25000,  pickup_date: getDate(6), created_date: getDate(6) },
  { id: 'ORD-015', customer_name: 'Fandi Ahmad',   service_name: 'Cuci + Setrika', status: 'selesai',   payment_status: 'paid',   total_amount: 60000,  pickup_date: getDate(6), created_date: getDate(6) },
];

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Budi Santoso'  },
  { id: 2, name: 'Siti Aminah'   },
  { id: 3, name: 'Rudi Hartono'  },
  { id: 4, name: 'Dewi Lestari'  },
  { id: 5, name: 'Ahmad Fauzi'   },
  { id: 6, name: 'Maya Sari'     },
];

export default function OwnerDashboard() {
  const { role, currentUser } = useRole();

  const orders    = MOCK_ORDERS;
  const customers = MOCK_CUSTOMERS;

  const totalRevenue    = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (o.total_amount || 0), 0);
  const activeOrders    = orders.filter(o => !['selesai', 'cancelled'].includes(o.status)).length;
  const pendingPayments = orders.filter(o => o.payment_status === 'unpaid').length;

  return (
    <div className="dashboard-wrapper">
      <PageHeader
        title={`Selamat Datang, ${currentUser?.name?.split(' ')[0] || 'Admin'} 👋`}
        subtitle={`Masuk sebagai ${role || 'Owner'} — Berikut ringkasan hari ini.`}
      />

      <div className="stats-grid">
        <StatCard label="Total Pesanan" value={orders.length}        icon={ShoppingBag} tint="primary" trend="+12%" />
        <StatCard label="Pendapatan"    value={formatIDR(totalRevenue)} icon={Wallet}   tint="success" trend="+8%" />
        <StatCard label="Pelanggan"     value={customers.length}     icon={Users}       tint="info"    trend="+3%" />
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
          <RevenueChart orders={orders} />
        </div>
        <div className="chart-side">
          <StatusBreakdown orders={orders} />
        </div>
      </div>

      <div className="table-container">
        <RecentOrdersTable orders={orders} />
      </div>
    </div>
  );
}