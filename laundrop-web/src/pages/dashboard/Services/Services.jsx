import { useState } from 'react';
import { Plus, Pencil, Trash2, Clock, Shirt, Zap, Sparkles, Wind, X, CheckCircle } from 'lucide-react';
import { MOCK_SERVICES } from '../../../data/mockData';
import { formatIDR } from '../../../data/format';
import EmptyState from '../../../components/shared/EmptyState';
import './Services.css';

// Icon sesuai layanan
const SERVICE_ICONS = {
  'Cuci + Setrika': Shirt,
  'Setrika Saja':   Zap,
  'Cuci Kering':    Sparkles,
  'Kilat':          Wind,
};

const getIcon = (name) => SERVICE_ICONS[name] || Sparkles;

const BLANK = {
  name: '', description: '', price: 0,
  unit: 'kg', duration: '', is_active: true,
};

const UNIT_OPTIONS = ['kg', 'pcs', 'item', 'set'];

export default function Services() {
  const [services, setServices]   = useState(MOCK_SERVICES);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [form, setForm]           = useState(BLANK);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openForm = (item = null) => {
    setEditing(item);
    setForm(item ? {
      name:        item.name,
      description: item.description || '',
      price:       item.price,
      unit:        item.unit        || 'kg',
      duration:    item.duration    || '',
      is_active:   item.is_active   !== false,
    } : BLANK);
    setFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price) || 0 };
    if (editing) {
      setServices(prev => prev.map(s => s.id === editing.id ? { ...s, ...data } : s));
      showToast('Layanan berhasil diupdate!');
    } else {
      setServices(prev => [...prev, { ...data, id: Date.now() }]);
      showToast('Layanan baru berhasil ditambahkan!');
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
    showToast('Layanan berhasil dihapus!', 'danger');
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="svc-page">

      {/* Toast */}
      {toast && (
        <div className={`svc-toast ${toast.type}`}>
          <CheckCircle size={18} />
          <span>{toast.msg}</span>
          <button className="svc-toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="svc-header">
        <div>
          <h1 className="svc-title">Services</h1>
          <p className="svc-subtitle">Kelola layanan service laundry</p>
        </div>
        <button className="svc-btn-add" onClick={() => openForm()}>
          <Plus size={16} /> New Service
        </button>
      </div>

      {/* Grid */}
      {services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No services yet"
          description="Create your first service offering."
          action={
            <button className="svc-btn-add" onClick={() => openForm()}>
              <Plus size={16} /> New Service
            </button>
          }
        />
      ) : (
        <div className="svc-grid">
          {services.map(s => {
            const Icon = getIcon(s.name);
            return (
              <div key={s.id} className={`svc-card ${!s.is_active ? 'inactive' : ''}`}>
                <div className="svc-card-top">
                  <div className="svc-icon-box">
                    <Icon size={20} />
                  </div>
                  {!s.is_active && (
                    <span className="svc-badge-inactive">Inactive</span>
                  )}
                </div>

                <h3 className="svc-name">{s.name}</h3>
                {s.description && <p className="svc-desc">{s.description}</p>}

                <div className="svc-price-row">
                  <span className="svc-price">{formatIDR(s.price)}</span>
                  <span className="svc-unit">/ {s.unit}</span>
                </div>

                {s.duration && (
                  <div className="svc-duration">
                    <Clock size={12} />
                    <span>{s.duration}</span>
                  </div>
                )}

                <div className="svc-card-actions">
                  <button
                    className="svc-action-btn"
                    onClick={() => openForm(s)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="svc-action-btn danger"
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <div className="svc-overlay" onClick={() => setFormOpen(false)}>
          <div className="svc-dialog" onClick={e => e.stopPropagation()}>
            <div className="svc-dialog-header">
              <h2 className="svc-dialog-title">
                {editing ? 'Edit Service' : 'New Service'}
              </h2>
              <button className="svc-dialog-close" onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="svc-form" onSubmit={handleSave}>
              <div className="svc-field">
                <label className="svc-label">Name *</label>
                <input
                  className="svc-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Service name"
                  required
                />
              </div>

              <div className="svc-field">
                <label className="svc-label">Description</label>
                <textarea
                  className="svc-input svc-textarea"
                  rows={2}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Short description..."
                />
              </div>

              <div className="svc-grid-3">
                <div className="svc-field">
                  <label className="svc-label">Price (Rp) *</label>
                  <input
                    className="svc-input"
                    type="number"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    required
                  />
                </div>
                <div className="svc-field">
                  <label className="svc-label">Unit</label>
                  <select
                    className="svc-input svc-select"
                    value={form.unit}
                    onChange={e => set('unit', e.target.value)}
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="svc-field">
                  <label className="svc-label">Duration</label>
                  <input
                    className="svc-input"
                    value={form.duration}
                    onChange={e => set('duration', e.target.value)}
                    placeholder="e.g. 2-3 hari"
                  />
                </div>
              </div>

              {/* Toggle Active */}
              <div className="svc-toggle-row">
                <div>
                  <p className="svc-toggle-title">Active</p>
                  <p className="svc-toggle-sub">
                    {form.is_active ? 'Service tersedia untuk pelanggan' : 'Service tidak ditampilkan'}
                  </p>
                </div>
                <button
                  type="button"
                  className={`svc-toggle ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => set('is_active', !form.is_active)}
                >
                  <div className={`svc-toggle-thumb ${form.is_active ? 'on' : ''}`} />
                </button>
              </div>

              <div className="svc-form-footer">
                <button
                  type="button"
                  className="svc-btn-cancel"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="svc-btn-save">
                  {editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleting && (
        <div className="svc-overlay" onClick={() => setDeleting(null)}>
          <div className="svc-dialog small" onClick={e => e.stopPropagation()}>
            <div className="svc-dialog-header">
              <h2 className="svc-dialog-title">Delete service?</h2>
              <button className="svc-dialog-close" onClick={() => setDeleting(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="svc-delete-body">
              <p>"{deleting.name}" will be permanently removed.</p>
            </div>
            <div className="svc-form-footer">
              <button className="svc-btn-cancel" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="svc-btn-delete" onClick={() => handleDelete(deleting.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}