import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, MoreHorizontal, UserCog, X, Phone, Mail, Search, Shield, Eye, EyeOff } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import api from '../../../services/api';
import Pagination from '../../../components/shared/Pagination';
import Toast from '../../../components/shared/Toast';
import EmptyState from '../../../components/shared/EmptyState';
import './Employees.css';

const ROLE_LABELS = { owner: 'Owner', employee: 'Karyawan' };
const ROLE_OPTIONS = ['employee', 'owner'];
const BLANK = { name: '', phone: '', email: '', password: '', role: 'employee', is_active: true };
const ITEMS_PER_PAGE = 9;

export default function Employees() {
  const { role } = useRole();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmployees = async (searchValue = search) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/employees', {
        params: { per_page: 100, search: searchValue },
      });
      const rows = response?.data?.data?.data ?? response?.data?.data ?? [];
      setEmployees(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setEmployees([]);
      showToast(error?.response?.data?.message || 'Gagal memuat data karyawan', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees(search);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => employees, [employees]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openForm = (item = null) => {
    setEditItem(item);
    setShowPassword(false);
    setForm(item ? {
      name: item.name,
      phone: item.phone || '',
      email: item.email || '',
      password: '',
      role: item.role || 'employee',
      is_active: item.is_active !== false,
    } : BLANK);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
      };

      if (editItem) {
        if (form.password) {
          payload.password = form.password;
        }
        await api.put(`/admin/employees/${editItem.id}`, payload);
        showToast('Karyawan berhasil diupdate!');
      } else {
        await api.post('/admin/employees', {
          ...payload,
          password: form.password,
        });
        showToast('Karyawan baru berhasil ditambahkan!');
      }

      setShowForm(false);
      setEditItem(null);
      await loadEmployees(search);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal menyimpan karyawan', 'danger');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/employees/${id}`);
      setDeleting(null);
      showToast('Karyawan berhasil dihapus!', 'danger');
      await loadEmployees(search);
    } catch (error) {
      showToast(error?.response?.data?.message || 'Gagal menghapus karyawan', 'danger');
    }
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const initials = (name) => name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  if (role !== 'owner') {
    return (
      <div className="emp-restricted">
        <UserCog size={48} className="emp-restricted-icon" />
        <h2 className="emp-restricted-title">Access Restricted</h2>
        <p className="emp-restricted-desc">Only owners can manage employees</p>
      </div>
    );
  }

  return (
    <div className="emp-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="emp-header">
        <div>
          <h1 className="emp-title">Employee Management</h1>
          <p className="emp-subtitle">{filtered.length} dari {employees.length} employees</p>
        </div>
        <button className="emp-btn-add" onClick={() => openForm()}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="emp-search-wrap">
        <Search size={15} className="emp-search-icon" />
        <input
          className="emp-search-input"
          placeholder="Cari nama, email, atau no. HP..."
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        {search && (
          <button className="emp-search-clear" onClick={() => setSearch('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {loading ? (
        <EmptyState title="Loading employees..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Tidak ada karyawan ditemukan"
          description="Coba ubah kata kunci pencarian"
          action={
            <button className="emp-btn-add" onClick={() => openForm()}>
              <Plus size={16} /> Add Employee
            </button>
          }
        />
      ) : (
        <>
          <div className="emp-grid">
            {paginated.map(emp => (
              <div key={emp.id} className="emp-card">
                <div className="emp-card-top">
                  <div className="emp-card-info">
                    <div className={`emp-avatar ${emp.is_active === false ? 'inactive' : ''}`}>
                      {initials(emp.name)}
                    </div>
                    <div>
                      <div className="emp-name-row">
                        <p className="emp-name">{emp.name}</p>
                        {emp.is_active === false && (
                          <span className="emp-badge-inactive">Inactive</span>
                        )}
                      </div>
                      <p className="emp-role">{ROLE_LABELS[emp.role] || emp.role}</p>
                    </div>
                  </div>

                  <div className="emp-menu-wrap">
                    <button
                      className="emp-menu-btn"
                      onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === emp.id && (
                      <>
                        <div className="emp-menu-backdrop" onClick={() => setOpenMenuId(null)} />
                        <div className="emp-dropdown">
                          <button
                            className="emp-dropdown-item"
                            onClick={() => { openForm(emp); setOpenMenuId(null); }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          {emp.role !== 'owner' && (
                            <>
                              <div className="emp-dropdown-divider" />
                              <button
                                className="emp-dropdown-item danger"
                                onClick={() => { setDeleting(emp); setOpenMenuId(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {emp.phone && (
                  <div className="emp-contact"><Phone size={12} /><span>{emp.phone}</span></div>
                )}
                {emp.email && (
                  <div className="emp-contact"><Mail size={12} /><span>{emp.email}</span></div>
                )}
              </div>
            ))}
          </div>

          <Pagination current={page} total={totalPages} onChange={setPage} />
        </>
      )}

      {showForm && createPortal(
        <div className="emp-overlay" onClick={() => setShowForm(false)}>
          <div className="emp-dialog" onClick={e => e.stopPropagation()}>
            <div className="emp-dialog-header">
              <h2 className="emp-dialog-title">{editItem ? 'Edit Employee' : 'New Employee'}</h2>
              <button className="emp-dialog-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="emp-form" onSubmit={handleSave} autoComplete="off">
              <div className="emp-field">
                <label className="emp-label">Name *</label>
                <input
                  className="emp-input"
                  name="employee_name"
                  autoComplete="off"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="emp-grid-2">
                <div className="emp-field">
                  <label className="emp-label">Phone *</label>
                  <input
                    className="emp-input"
                    name="employee_phone"
                    autoComplete="off"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
                <div className="emp-field">
                  <label className="emp-label">Email *</label>
                  <input
                    className="emp-input"
                    type="email"
                    name="employee_email"
                    autoComplete="off"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>
              <div className="emp-grid-2">
                <div className="emp-field">
                  <label className="emp-label">Role</label>
                  <select
                    className="emp-input emp-select"
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
                <div className="emp-field">
                  <label className="emp-label">Password {editItem ? '(optional)' : '*'}</label>
                  <div className="emp-password-wrap">
                    <input
                      className="emp-input emp-password-input"
                      type={showPassword ? 'text' : 'password'}
                      name="employee_password"
                      autoComplete={editItem ? 'off' : 'new-password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder={editItem ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                      required={!editItem}
                    />
                    <button
                      type="button"
                      className="emp-password-toggle"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="emp-toggle-row">
                <label className="emp-label">Active</label>
                <button
                  type="button"
                  className={`emp-toggle ${form.is_active ? 'on' : 'off'}`}
                  onClick={() => set('is_active', !form.is_active)}
                >
                  <div className={`emp-toggle-thumb ${form.is_active ? 'on' : ''}`} />
                </button>
              </div>
              <div className="emp-form-footer">
                <button type="button" className="emp-btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="emp-btn-save">
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {deleting && createPortal(
        <div className="emp-overlay" onClick={() => setDeleting(null)}>
          <div className="emp-dialog small" onClick={e => e.stopPropagation()}>
            <div className="emp-dialog-header">
              <h2 className="emp-dialog-title">Hapus Karyawan?</h2>
              <button className="emp-dialog-close" onClick={() => setDeleting(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="emp-delete-body">
              <p>Karyawan <strong>{deleting.name}</strong> akan dihapus permanen.</p>
            </div>
            <div className="emp-form-footer">
              <button className="emp-btn-cancel" onClick={() => setDeleting(null)}>Batal</button>
              <button className="emp-btn-delete" onClick={() => handleDelete(deleting.id)}>Hapus</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
