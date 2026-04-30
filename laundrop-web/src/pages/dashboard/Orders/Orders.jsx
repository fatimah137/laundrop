import { useState, useMemo } from 'react';
import { Plus, List, Map as MapIcon } from 'lucide-react';
import { useRole }          from '../../../context/RoleContext';
import { MOCK_ORDERS, MOCK_EMPLOYEES } from '../../../data/mockData';
import { STATUS_CONFIG}     from '../../../data/statusConfig';
import OrderListView        from '../../../components/Dashboard/Orders/OrderListView';
import PickupMap            from '../../../components/Dashboard/Orders/PickupMap';
import OrderFormDialog      from '../../../components/Dashboard/Orders/OrderFormDialog';
import OrderDetailModal     from '../../../components/Dashboard/Orders/OrderDetailModal';
import './Orders.css';

/* ── Status filter — sesuai statusConfig.js ──────────────────────── */
const STATUS_FILTERS = ['all', 'pending', 'pickup', 'process', 'ready', 'delivery', 'selesai', 'cancelled'];

/* ── Label per filter — ambil dari statusConfig ──────────────────── */
const getFilterLabel = (key) => {
  if (key === 'all') return 'Semua';
  return STATUS_CONFIG[key]?.label ?? key;
};

/* ── Component ───────────────────────────────────────────────────── */
export default function Orders() {
  const { role } = useRole();

  const [orders,       setOrders]       = useState(MOCK_ORDERS);
  const [view,         setView]         = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [editOrder,    setEditOrder]    = useState(null);
  const [detailOrder,  setDetailOrder]  = useState(null);
  const [deleteOrder,  setDeleteOrder]  = useState(null);

  const canDelete = role === 'owner' || role === 'admin';

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchSearch = !search ||
        [o.order_number, o.customer_name, o.customer_phone]
          .some(v => (v || '').toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  const handleSave = (data) => {
    if (editOrder) {
      setOrders(prev => prev.map(o => o.id === editOrder.id ? { ...o, ...data } : o));
    } else {
      const newOrder = {
        ...data,
        id:           Date.now(),
        order_number: `LD-${Date.now().toString().slice(-8)}`,
        pickup_date:  new Date().toISOString().split('T')[0],
      };
      setOrders(prev => [newOrder, ...prev]);
    }
    setShowForm(false);
    setEditOrder(null);
  };

  const handleDelete = (id) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeleteOrder(null);
  };

  const handleStatusChange = (id, newStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="ow-orders-page">

      {/* ── Topbar ── */}
      <div className="ow-orders-topbar">
        <div className="ow-orders-topbar-left">
          <h1 className="ow-orders-title">Order</h1>
          <p className="ow-orders-subtitle">{orders.length} total pesanan</p>
        </div>
        <div className="ow-orders-topbar-right">
          {/* View toggle */}
          <div className="ow-view-toggle">
            <button
              className={`ow-view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <List size={15} /> List 
            </button>
            <button
              className={`ow-view-btn ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
            >
              <MapIcon size={15} /> Map
            </button>
          </div>
          {/* New order button */}
          {canDelete && (
            <button
              className="ow-btn-new"
              onClick={() => { setEditOrder(null); setShowForm(true); }}
            >
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="ow-status-filters">
        {STATUS_FILTERS.map(s => {
          const count = s !== 'all' ? orders.filter(o => o.status === s).length : null;
          return (
            <button
              key={s}
              className={`ow-filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {getFilterLabel(s)}
              {count !== null && (
                <span className={`ow-filter-count ${statusFilter === s ? 'active' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {view === 'map' ? (
        <div className="ow-map-wrapper">
          <PickupMap orders={filtered} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="ow-orders-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <p className="ow-orders-empty-title">Tidak ada pesanan ditemukan</p>
          <p className="ow-orders-empty-sub">Coba ubah filter atau buat pesanan baru</p>
          {canDelete && (
            <button
              className="ow-btn-new"
              style={{ marginTop: 16 }}
              onClick={() => { setEditOrder(null); setShowForm(true); }}
            >
              <Plus size={16} /> Buat Pesanan Pertama
            </button>
          )}
        </div>
      ) : (
        <OrderListView
          orders={filtered}
          employees={MOCK_EMPLOYEES}
          role={role}
          onEdit={(order) => { setEditOrder(order); setShowForm(true); }}
          onDelete={(id) => setDeleteOrder(orders.find(o => o.id === id))}
          onViewDetail={setDetailOrder}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* ── Detail Modal ── */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteOrder && (
        <div className="ow-modal-overlay" onClick={() => setDeleteOrder(null)}>
          <div className="ow-modal-box small" onClick={e => e.stopPropagation()}>
            <div className="ow-modal-header">
              <h3>Hapus Pesanan?</h3>
              <button className="ow-modal-close" onClick={() => setDeleteOrder(null)}>✕</button>
            </div>
            <div className="ow-modal-body">
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Pesanan <strong>{deleteOrder.order_number}</strong> akan dihapus permanen.
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="ow-modal-footer">
              <button className="ow-btn-cancel" onClick={() => setDeleteOrder(null)}>Batal</button>
              <button className="ow-btn-delete" onClick={() => handleDelete(deleteOrder.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Form Dialog ── */}
      {showForm && (
        <OrderFormDialog
          order={editOrder}
          employees={MOCK_EMPLOYEES}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditOrder(null); }}
        />
      )}
    </div>
  );
}