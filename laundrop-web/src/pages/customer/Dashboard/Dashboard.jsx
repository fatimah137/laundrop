import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, CheckCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRole } from '../../../context/RoleContext';
import api from '../../../services/api';
import Layout from '../../../components/Customer/Layout';
import { formatRp } from '../../../context/AppContext';
import StatCard from '../../../components/Customer/Dashboard/StatCard';
import OrderCard from '../../../components/Customer/Dashboard/OrderCard';
import ServiceCards from '../../../components/Customer/Dashboard/ServiceCards';
import QuickActions from '../../../components/Customer/Dashboard/QuickActions';
import TrackOrderModal from '../../../components/Customer/Orders/TrackOrderModal';
import './Dashboard.css';

const STATUS_LABEL_MAP = {
  pending: 'Waiting Pickup',
  confirmed: 'Waiting Pickup',
  picking_up: 'Pickup',
  picked_up: 'Pickup',
  billed: 'Waiting Payment',
  paid: 'Processing',
  processing: 'Processing',
  ready: 'Ready',
  delivering: 'Delivery',
  delivered: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '-';
  if (typeof value === 'string' && value.length >= 5) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard() {
  const { currentUser } = useRole();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingOrder, setTrackingOrder] = useState(null);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/orders', { params: { per_page: 100 } });
        const rows = response?.data?.data?.data ?? [];

        const mapped = rows.map((row) => {
          const unitPrice = Number(row?.service?.price_per_kg ?? 0);
          const estimatedWeight = Number(row?.estimated_weight ?? 0);
          const actualWeight = Number(row?.actual_weight ?? 0);
          const weightForPrice = actualWeight > 0 ? actualWeight : estimatedWeight;
          const estimatedPrice = unitPrice * estimatedWeight;
          const finalPrice = unitPrice * weightForPrice;
          const statusLabel = STATUS_LABEL_MAP[row?.status] ?? 'Pending';

          return {
            id: row.order_number || `ORD-${row.id}`,
            rawId: row.id,
            order_number: row.order_number || `ORD-${row.id}`,
            service: row?.service?.name ?? 'Layanan Laundry',
            status: statusLabel,
            backend_status: row?.status,
            paymentMethod: (row?.payment_method || '').toUpperCase(),
            payment_status: row?.status === 'delivered' ? 'paid' : 'unpaid',
            verified: actualWeight > 0,
            estimated_price: estimatedPrice,
            price: finalPrice,
            weight: estimatedWeight,
            actual_weight: actualWeight,
            pickupAddress: row?.pickup_address ?? '-',
            pickupDate: formatDate(row?.pickup_date),
            pickupTime: formatTime(row?.pickup_time),
            date: formatDate(row?.created_at),
            createdAt: row?.created_at,
          };
        });

        if (mounted) setOrders(mapped);
      } catch (err) {
        if (!mounted) return;
        setOrders([]);
        setError(err?.response?.data?.message || 'Gagal memuat data dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled'),
    [orders]
  );

  const activeOrdersPreview = useMemo(
    () => activeOrders.slice(0, 3),
    [activeOrders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'Completed'),
    [orders]
  );

  const totalSpending = useMemo(
    () => completedOrders.reduce((sum, o) => sum + Number(o.price || 0), 0),
    [completedOrders]
  );

  return (
    <Layout>
      <div className="dashboard-container">

        {/* 1. Greeting Banner */}
        <section className="greeting-banner">
          <div className="greeting-content">
            <p className="greeting-subtitle">{greeting},</p>
            <h2 className="greeting-title">
              {currentUser?.name || 'User'} 👋
            </h2>
            <p className="greeting-description">
              {loading
                ? 'Memuat data pesanan...'
                : `You have ${activeOrders.length} active order${activeOrders.length !== 1 ? 's' : ''} right now.`}
            </p>
          </div>
        </section>

        {/* 2. Stats Grid */}
        <section className="stats-grid">
          <StatCard
            icon={ShoppingBag}
            label="Active Orders"
            value={activeOrders.length}
            colorClass="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Orders"
            value={completedOrders.length}
            colorClass="green"
          />
          <StatCard
            icon={DollarSign}
            label="Total Spending"
            value={formatRp(totalSpending)}
            colorClass="purple"
          />
        </section>

        {error && (
          <section className="content-card">
            <div className="dashboard-error">{error}</div>
          </section>
        )}

        {/* 3. Active Orders Section */}
        {activeOrders.length > 0 && (
          <section className="content-card">
            <div className="card-header">
              <h3>Active Orders</h3>
              <div className="card-header-actions">
                <span className="badge-blue">{activeOrders.length} active</span>
                <Link to="/customer/history" className="view-all-link">
                  View all <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="card-body no-padding">
              {activeOrdersPreview.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrack={(o) => setTrackingOrder(o)}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && activeOrders.length === 0 && (
          <section className="content-card">
            <div className="empty-dashboard-state">
              Belum ada pesanan aktif. Mulai pesanan pertama Anda dari menu Order.
            </div>
          </section>
        )}

        {/* 4. Services Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Available Services</h3>
          </div>
          <div className="card-body">
            <ServiceCards />
          </div>
        </section>

        {/* 5. Quick Actions */}
        <QuickActions />

        {/* 6. Recent Orders Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/customer/history" className="view-all-link">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="empty-dashboard-state small">
              Belum ada recent order untuk akun ini.
            </div>
          ) : (
            <div className="card-body no-padding">
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="recent-order-item">
                  <div className="recent-info">
                    <p className="recent-id">{order.order_number || order.id}</p>
                    <p className="recent-sub">{order.date} · {order.service}</p>
                  </div>
                  <div className="recent-right">
                    <span className={`status-text ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                      {order.status}
                    </span>
                    <span className="recent-price">
                      {order.verified
                        ? formatRp(order.price)
                        : `~${formatRp(order.estimated_price || order.price)}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Track Modal */}
      {trackingOrder && (
        <TrackOrderModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

    </Layout>
  );
}