import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, UserCog, X, Phone, Mail } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import { MOCK_EMPLOYEES } from '../../../data/mockData';
import EmptyState from '../../../components/shared/EmptyState';
import Toast from '../../../components/shared/Toast'; // ✅ tambah ini
import './Employees.css';

const ROLE_LABELS = {
  owner: 'Owner',
  employee: 'Employee',
};

const ROLE_OPTIONS = ['owner', 'employee'];

const BLANK = { name: '', phone: '', email: '', role: 'employee', is_active: true };

export default function Employees() {
  const { role } = useRole();

  const [employees, setEmployees]   = useState(MOCK_EMPLOYEES);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      name: item.name,
      phone: item.phone || '',
      email: item.email || '',
      role: item.role || 'employee',
      is_active: item.is_active !== false,
    } : BLANK);
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editItem) {
      setEmployees(prev => prev.map(emp =>
        emp.id === editItem.id ? { ...emp, ...form } : emp
      ));
      showToast('Karyawan berhasil diupdate!');
    } else {
      setEmployees(prev => [
        ...prev,
        { ...form, id: Date.now(), joined: new Date().toISOString().split('T')[0] }
      ]);
      showToast('Karyawan baru berhasil ditambahkan!');
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setDeleting(null);
    showToast('Karyawan berhasil dihapus!', 'danger');
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const initials = (name) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

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

      {/* ✅ Toast baru */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="emp-header">
        <div>
          <h1 className="emp-title">Employee Management</h1>
          <p className="emp-subtitle">{employees.length} employees</p>
        </div>
        <button className="emp-btn-add" onClick={() => openForm()}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Grid */}
      {employees.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No employees"
          description="Add your team members"
          action={
            <button className="emp-btn-add" onClick={() => openForm()}>
              <Plus size={16} /> Add Employee
            </button>
          }
        />
      ) : (
        <div className="emp-grid">
          {employees.map(emp => (
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
                        <div className="emp-dropdown-divider" />
                        <button
                          className="emp-dropdown-item danger"
                          onClick={() => { setDeleting(emp); setOpenMenuId(null); }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {emp.phone && (
                <div className="emp-contact">
                  <Phone size={12} /><span>{emp.phone}</span>
                </div>
              )}
              {emp.email && (
                <div className="emp-contact">
                  <Mail size={12} /><span>{emp.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="emp-overlay" onClick={() => setShowForm(false)}>
          <div className="emp-dialog" onClick={e => e.stopPropagation()}>
            <div className="emp-dialog-header">
              <h2 className="emp-dialog-title">
                {editItem ? 'Edit Employee' : 'New Employee'}
              </h2>
              <button className="emp-dialog-close" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="emp-form" onSubmit={handleSave}>
              <div className="emp-field">
                <label className="emp-label">Name *</label>
                <input
                  className="emp-input"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="emp-grid-2">
                <div className="emp-field">
                  <label className="emp-label">Phone</label>
                  <input
                    className="emp-input"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="emp-field">
                  <label className="emp-label">Email</label>
                  <input
                    className="emp-input"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

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
                <button
                  type="button"
                  className="emp-btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="emp-btn-save">
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleting && (
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
        </div>
      )}

    </div>
  );
}