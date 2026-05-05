import { useState, useMemo } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, Phone, Mail, MapPin, X, ShoppingBag } from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_ORDERS } from '../../../data/mockData';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import Toast from '../../../components/shared/Toast';
import './Customers.css';

const generateCustomers = () =>
  MOCK_CUSTOMERS.map(c => ({
    ...c,
    total_orders: MOCK_ORDERS.filter(o => o.customer_name === c.name).length,
    total_spent: MOCK_ORDERS
      .filter(o => o.customer_name === c.name)
      .reduce((s, o) => s + (o.total_amount || 0), 0),
  }));

const getCustomerOrders = (name) =>
  MOCK_ORDERS.filter(o => o.customer_name === name).slice(0, 3);

const BLANK = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const [customers, setCustomers] = useState(generateCustomers);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() =>
    customers.filter(c =>
      !search || [c.name, c.phone, c.email]
        .some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
    ), [customers, search]
  );

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openForm = (item = null) => {
    setEditing(item);
    setForm(item ? {
      name: item.name,
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      notes: item.notes || '',
    } : BLANK);
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      setCustomers(prev =>
        prev.map(c => c.id === editing.id ? { ...c, ...form } : c)
      );
      showToast('Customer berhasil diupdate!');
    } else {
      setCustomers(prev => [
        ...prev,
        { ...form, id: Date.now(), total_orders: 0, total_spent: 0 }
      ]);
      showToast('Customer baru berhasil ditambahkan!');
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
    showToast('Customer berhasil dihapus!', 'danger');
  };

  const set = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="cust-page">

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="cust-header">
        <div>
          <h1 className="cust-title">Customers</h1>
          <p className="cust-subtitle">Kelola data pelanggan</p>
        </div>
        <button className="cust-btn-add" onClick={() => openForm()}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="cust-search-wrap">
        <Search size={16} className="cust-search-icon" />
        <input
          className="cust-search-input"
          placeholder="Search customers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="cust-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to get started."
          action={
            <button className="cust-btn-add" onClick={() => openForm()}>
              <Plus size={16} /> Add Customer
            </button>
          }
        />
      ) : (
        <div className="cust-grid">
          {filtered.map(c => (
            <div key={c.id} className="cust-card">
              <div className="cust-card-top">
                <div className="cust-avatar">{initials(c.name)}</div>
                <div className="cust-card-info">
                  <p className="cust-name">{c.name}</p>
                  {c.phone && (
                    <div className="cust-contact">
                      <Phone size={12} /><span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="cust-contact">
                      <Mail size={12} /><span>{c.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {c.address && <p className="cust-address">{c.address}</p>}

              <div className="cust-card-actions">
                <button className="cust-action-btn" onClick={() => setViewing(c)}>
                  <Eye size={14} /> View
                </button>
                <button className="cust-action-btn" onClick={() => openForm(c)}>
                  <Pencil size={14} /> Edit
                </button>
                <button className="cust-action-btn danger" onClick={() => setDeleting(c)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODAL */}
      {viewing && (
        <div className="cust-overlay" onClick={() => setViewing(null)}>
          <div className="cust-dialog wide" onClick={e => e.stopPropagation()}>
            <div className="cust-dialog-header">
              <h2 className="cust-dialog-title">{viewing.name}</h2>
              <button className="cust-dialog-close" onClick={() => setViewing(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cust-detail-body">
              <div className="cust-detail-stats">
                <div className="cust-detail-stat">
                  <p className="cust-detail-stat-label">TOTAL ORDERS</p>
                  <p className="cust-detail-stat-value">{viewing.total_orders || 0}</p>
                </div>
                <div className="cust-detail-stat">
                  <p className="cust-detail-stat-label">TOTAL SPENT</p>
                  <p className="cust-detail-stat-value">
                    Rp {(viewing.total_spent || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="cust-detail-stat">
                  <p className="cust-detail-stat-label">AVG. ORDER</p>
                  <p className="cust-detail-stat-value">
                    Rp {viewing.total_orders
                      ? Math.round(viewing.total_spent / viewing.total_orders).toLocaleString('id-ID')
                      : 0}
                  </p>
                </div>
              </div>

              <div className="cust-detail-contacts">
                {viewing.phone && <div className="cust-detail-contact-row"><Phone size={15} /> {viewing.phone}</div>}
                {viewing.email && <div className="cust-detail-contact-row"><Mail size={15} /> {viewing.email}</div>}
                {viewing.address && <div className="cust-detail-contact-row"><MapPin size={15} /> {viewing.address}</div>}
              </div>

              {getCustomerOrders(viewing.name).length > 0 && (
                <div className="cust-detail-orders">
                  <div className="cust-detail-orders-header">
                    <ShoppingBag size={14} />
                    <span>ORDER HISTORY</span>
                  </div>
                  {getCustomerOrders(viewing.name).map(o => (
                    <div key={o.id} className="cust-detail-order-item">
                      <div>
                        <p className="cust-detail-order-id">{o.order_number}</p>
                        <p className="cust-detail-order-service">
                          {o.service_name} · {o.date || o.pickup_date}
                        </p>
                      </div>
                      <div className="cust-detail-order-right">
                        <span className="cust-detail-order-price">
                          Rp {(o.total_amount || 0).toLocaleString('id-ID')}
                        </span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {formOpen && (
        <div className="cust-overlay" onClick={() => setFormOpen(false)}>
          <div className="cust-dialog" onClick={e => e.stopPropagation()}>
            <div className="cust-dialog-header">
              <h2 className="cust-dialog-title">
                {editing ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button className="cust-dialog-close" onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="cust-form" onSubmit={handleSave}>
              <div className="cust-field">
                <label className="cust-label">Name *</label>
                <input
                  className="cust-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
              </div>

              <div className="cust-grid-2">
                <div className="cust-field">
                  <label className="cust-label">Phone *</label>
                  <input
                    className="cust-input"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="cust-field">
                  <label className="cust-label">Email</label>
                  <input
                    className="cust-input"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="cust-field">
                <label className="cust-label">Address</label>
                <input
                  className="cust-input"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>

              <div className="cust-field">
                <label className="cust-label">Notes</label>
                <textarea
                  className="cust-input cust-textarea"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>

              <div className="cust-form-footer">
                <button type="button" className="cust-btn-cancel" onClick={() => setFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="cust-btn-save">
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleting && (
        <div className="cust-overlay" onClick={() => setDeleting(null)}>
          <div className="cust-dialog small" onClick={e => e.stopPropagation()}>
            <div className="cust-dialog-header">
              <h2 className="cust-dialog-title">Hapus Customer?</h2>
              <button className="cust-dialog-close" onClick={() => setDeleting(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cust-delete-body">
              <p>Customer <strong>{deleting.name}</strong> akan dihapus permanen.</p>
            </div>

            <div className="cust-form-footer">
              <button className="cust-btn-cancel" onClick={() => setDeleting(null)}>Batal</button>
              <button className="cust-btn-delete" onClick={() => handleDelete(deleting.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}