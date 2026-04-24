import { useState } from 'react';
import { Clock, ChevronRight, Truck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import Layout from '../../../components/Customer/Layout';
import PageTitle from '../../../components/ui/PageTitle';
import StatusBadge from '../../../components/ui/StatusBadge';
import OrderDetailModal from '../../../components/Customer/Orders/OrderDetailModal';
import TrackOrderModal from '../../../components/Customer/Orders/TrackOrderModal';
import './History.css';

const FILTERS = ['All', 'Pending', 'On Progress', 'Completed', 'Cancelled'];

export default function OrderHistory() {
  const { orders } = useApp();
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <Layout>
      <div className="order-history-page">
        <PageTitle title="Order History" subtitle="View and track all your past orders." />

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Clock size={32} />
            </div>
            <p className="empty-title">No orders found</p>
            <p className="empty-sub">Try a different filter</p>
          </div>
        ) : (
          <div className="order-list">
            {filtered.map(order => (
              <div key={order.id} className="order-card">
                <div
                  className="order-card-main"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-card-left">
                    <div className="order-icon">
                      <Clock size={20} />
                    </div>
                    <div className="order-info">
                      <div className="order-id-row">
                        <p className="order-id">{order.id}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="order-meta">
                        {order.date} · {order.service} · {order.weight}kg
                      </p>
                    </div>
                  </div>
                  <div className="order-card-right">
                    <p className="order-price">Rp {order.price.toLocaleString('id-ID')}</p>
                    <ChevronRight size={16} className="chevron-icon" />
                  </div>
                </div>

                {/* Track button */}
                {(order.status === 'Pending' || order.status === 'On Progress') && (
                  <div className="order-card-footer">
                    <button
                      className="track-btn"
                      onClick={() => setTrackingOrder(order)}
                    >
                      <Truck size={14} /> Track Order
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        {trackingOrder && (
          <TrackOrderModal
            order={trackingOrder}
            onClose={() => setTrackingOrder(null)}
          />
        )}
      </div>
    </Layout>
  );
}