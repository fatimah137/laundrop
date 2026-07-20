import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Clock, Shirt, Zap, Sparkles, Wind, X } from 'lucide-react';
import api from '../../../services/api';
import { formatIDR } from '../../../data/format';
import EmptyState from '../../../components/shared/EmptyState';
import Toast from '../../../components/shared/Toast';
import './Services.css';

const SERVICE_ICONS = {
  'Cuci + Setrika': Shirt,
  'Setrika Saja': Zap,
  'Cuci Kering': Sparkles,
  'Kilat': Wind,
};

const getIcon = (name) => SERVICE_ICONS[name] || Sparkles;

const BLANK = {
  name: '',
  description: '',
  price_per_kg: 0,
  est_duration_hours: 24,
  is_active: true,
};

const UNIT_LABEL = 'kg';

const formatDuration = (hours) => {
  const value = Number(hours || 0);
  if (!value) return 'Estimasi tersedia';
  if (value % 24 === 0) {
    const days = value / 24;
    return `${days} hari`;
  }
  return `${value} jam`;
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/services');
      const rows = response?.data?.data ?? [];
      setServices(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setServices([]);
      showToast(error?.response?.data?.message || 'Gagal memuat data layanan', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const filtered = useMemo(() => services, [services]);

  const openForm = (item = null) => {
    setEditing(item);
    setForm(item ? {
      name: item.name,
      description: item.description || '',
      price_per_kg: item.price_per_kg ?? 0,
      est_duration_hours: item.est_duration_hours ?? 24,
      is_active: item.is_active !== false,
    } : BLANK);
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price_per_kg: Number(form.price_per_kg || 0),
        est_duration_hours: Number(form.est_duration_hours || 0),
        is_active: Boolean(form.is_active),
      };

      if (editing) {
        await api.put(`/admin/services/${editing.id}`, payload);
        showToast('Layanan berhasil diupdate!', 'success');
      } else {
        await api.post('/admin/services', payload);
        showToast('Layanan baru berhasil ditambahkan!', 'success');
      }

      setFormOpen(false);
      setEditing(null);
      await loadServices();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal menyimpan layanan', 'danger');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/services/${id}`);
      setDeleting(null);
      showToast('Layanan berhasil dinonaktifkan!', 'danger');
      await loadServices();
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal menonaktifkan layanan', 'danger');
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="svc-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="svc-header">
        <div>
          <h1 className="svc-title">Services</h1>
          <p className="svc-subtitle">Kelola layanan service laundry</p>
        </div>
        <button className="svc-btn-add" onClick={() => openForm()}>
          <Plus size={16} /> New Service
        </button>
      </div>

      {loading ? (
        <EmptyState title="Loading services..." />
      ) : filtered.length === 0 ? (
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
          {filtered.map(s => {
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

                {s.description && (
                  <p className="svc-desc">{s.description}</p>
                )}

                {!s.is_active && (
                  <p className="svc-status-note">Layanan ini tidak tampil di halaman customer.</p>
                )}

                <div className="svc-price-row">
                  <span className="svc-price">{formatIDR(s.price_per_kg)}</span>
                  <span className="svc-unit">/ {UNIT_LABEL}</span>
                </div>

                {s.est_duration_hours !== null && s.est_duration_hours !== undefined && (
                  <div className="svc-duration">
                    <Clock size={12} />
                    <span>{formatDuration(s.est_duration_hours)}</span>
                  </div>
                )}

                <div className="svc-card-actions">
                  <button className="svc-action-btn" onClick={() => openForm(s)}>
                    <Pencil size={14} /> Edit
                  </button>

                  {s.is_active && (
                    <button className="svc-action-btn danger" onClick={() => setDeleting(s)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="svc-overlay" onClick={() => setFormOpen(false)}>
          <div className="svc-dialog" onClick={e => e.stopPropagation()}>
            <div className="svc-dialog-header">
              <h2 className="svc-dialog-title">{editing ? 'Edit Service' : 'New Service'}</h2>
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
                />
              </div>

              <div className="svc-grid-3">
                <div className="svc-field">
                  <label className="svc-label">Price / kg *</label>
                  <input
                    className="svc-input"
                    type="number"
                    min="0"
                    value={form.price_per_kg}
                    onChange={e => set('price_per_kg', e.target.value)}
                    required
                  />
                </div>

                <div className="svc-field">
                  <label className="svc-label">Duration (hours) *</label>
                  <input
                    className="svc-input"
                    type="number"
                    min="1"
                    value={form.est_duration_hours}
                    onChange={e => set('est_duration_hours', e.target.value)}
                    required
                  />
                </div>

                <div className="svc-field">
                  <label className="svc-label">Status</label>
                  <div className="svc-toggle-row">
                    <div>
                      <p className="svc-toggle-title">{form.is_active ? 'Active' : 'Inactive'}</p>
                      <p className="svc-toggle-sub">Layanan tampil di menu customer</p>
                    </div>
                    <button
                      type="button"
                      className={`svc-toggle ${form.is_active ? 'on' : 'off'}`}
                      onClick={() => set('is_active', !form.is_active)}
                    >
                      <div className={`svc-toggle-thumb ${form.is_active ? 'on' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="svc-form-footer">
                <button type="button" className="svc-btn-cancel" onClick={() => setFormOpen(false)}>
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

      {deleting && (
        <div className="svc-overlay" onClick={() => setDeleting(null)}>
          <div className="svc-dialog small" onClick={e => e.stopPropagation()}>
            <div className="svc-dialog-header">
              <h2>Nonaktifkan service?</h2>
              <button className="svc-dialog-close" onClick={() => setDeleting(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="svc-delete-body">
              <p>"{deleting.name}" akan dinonaktifkan dari menu customer.</p>
            </div>

            <div className="svc-form-footer">
              <button className="svc-btn-cancel" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="svc-btn-delete" onClick={() => handleDelete(deleting.id)}>
                Nonaktifkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
