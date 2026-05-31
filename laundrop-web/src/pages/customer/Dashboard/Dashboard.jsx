import { useState } from 'react';
import { ShoppingBag, CheckCircle, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { useRole } from '../../../context/RoleContext';
import Layout from '../../../components/Customer/Layout';
import { formatRp } from '../../../context/AppContext';
import StatCard from '../../../components/Customer/Dashboard/StatCard';
import OrderCard from '../../../components/Customer/Dashboard/OrderCard';
import ServiceCards from '../../../components/Customer/Dashboard/ServiceCards';
import QuickActions from '../../../components/Customer/Dashboard/QuickActions';
import TrackOrderModal from '../../../components/Customer/Orders/TrackOrderModal';
import QRISModal from '../../../components/Customer/Orders/QRISModal';
import './Dashboard.css';

export default function Dashboard() {
  const {
    activeOrders,
    completedOrders,
    totalSpending,
    orders,
    confirmPayment,
  } = useApp();

  const { currentUser } = useRole();

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [qrisOrder, setQrisOrder]         = useState(null);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Order yang butuh pembayaran QRIS — verified tapi belum bayar
  const pendingQrisOrders = activeOrders.filter(
    o => o.verified && o.paymentMethod === 'QRIS' && o.payment_status !== 'paid'
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
              You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''} right now.
            </p>
          </div>
        </section>

        {/* 2. QRIS Payment Alert — muncul hanya kalau ada order yang perlu dibayar */}
        {pendingQrisOrders.length > 0 && (
          <section className="qris-alert">
            <div className="qris-alert-left">
              <div className="qris-alert-icon">⚡</div>
              <div>
                <p className="qris-alert-title">Pembayaran QRIS Menunggu</p>
                <p className="qris-alert-sub">
                  {pendingQrisOrders.length} pesanan menunggu pembayaran sebelum diproses
                </p>
              </div>
            </div>
            <button
              className="qris-alert-btn"
              onClick={() => setQrisOrder(pendingQrisOrders[0])}
            >
              Bayar Sekarang
            </button>
          </section>
        )}

        {/* 3. Stats Grid */}
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

        {/* 4. Active Orders Section */}
        {activeOrders.length > 0 && (
          <section className="content-card">
            <div className="card-header">
              <h3>Active Orders</h3>
              <span className="badge-blue">{activeOrders.length} active</span>
            </div>
            <div className="card-body no-padding">
              {activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrack={(o) => setTrackingOrder(o)}
                  onPayQris={(o) => setQrisOrder(o)} // ✅ pass ke OrderCard
                />
              ))}
            </div>
          </section>
        )}

        {/* 5. Services Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Available Services</h3>
          </div>
          <div className="card-body">
            <ServiceCards />
          </div>
        </section>

        {/* 6. Quick Actions */}
        <QuickActions />

        {/* 7. Recent Orders Section */}
        <section className="content-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/customer/history" className="view-all-link">
              View all <ArrowRight size={16} />
            </Link>
          </div>
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
                    {/* ✅ tampilkan estimasi kalau belum verified */}
                    {order.verified
                      ? formatRp(order.price)
                      : `~${formatRp(order.estimated_price || order.price)}`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Track Modal */}
      {trackingOrder && (
        <TrackOrderModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {/* ✅ QRIS Modal — hanya muncul setelah employee verifikasi */}
      {qrisOrder && (
        <QRISModal
          order={qrisOrder}
          onSuccess={() => {
            confirmPayment(qrisOrder.id);
            setQrisOrder(null);
          }}
          onClose={() => setQrisOrder(null)}
        />
      )}

    </Layout>
  );
}