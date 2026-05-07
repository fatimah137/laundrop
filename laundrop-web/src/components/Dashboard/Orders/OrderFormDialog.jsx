import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X } from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_SERVICES, MOCK_EMPLOYEES } from '../../../data/mockData';
import './OrderFormDialog.css';

const STATUS_OPTIONS   = ['pending', 'pickup', 'proses', 'siap', 'delivery', 'selesai'];
const PAYMENT_STATUSES = ['paid', 'unpaid'];
const PAYMENT_METHODS  = ['cash', 'qris', 'transfer'];

function calcTotal(service, form) {
  if (!service) return form.total_amount || 0;
  if (service.unit === 'pcs') {
    return (parseFloat(form.total_clothes) || 0) * (service.price || 0);
  }
  return (parseFloat(form.weight) || 0) * (service.price || 0);
}

export default function OrderFormDialog({ order, employees = MOCK_EMPLOYEES, onSave, onClose }) {
  const fileInputRef = useRef();
  const [ocrLoading, setOcrLoading]                     = useState(false);
  const [saving, setSaving]                             = useState(false);
  const [customers]                                     = useState(MOCK_CUSTOMERS);
  const [services]                                      = useState(MOCK_SERVICES);
  const [customerInput, setCustomerInput]               = useState(order?.customer_name || '');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedService, setSelectedService]           = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    order_id:          order?.order_id          || `ORD-${String(Date.now()).slice(-4)}`,
    customer_name:     order?.customer_name     || '',
    customer_phone:    order?.customer_phone    || '',
    address:           order?.address           || '',
    latitude:          order?.latitude          || -6.99,
    longitude:         order?.longitude         || 110.42,
    service_name:      order?.service_name      || '',
    unit:              order?.unit              || 'kg',
    weight:            order?.weight            || '',
    total_clothes:     order?.total_clothes     || '',
    status:            order?.status            || 'pending',
    assigned_employee: order?.assigned_employee || '',
    total_amount:      order?.total_amount      || 0,
    payment_status:    order?.payment_status    || 'unpaid',
    payment_method:    order?.payment_method    || 'cash',
    notes:             order?.notes             || '',
    pickup_date:       order?.pickup_date
      ? order.pickup_date.slice(0, 10) : today,
  });

  useEffect(() => {
    if (order?.service_name) {
      const found = MOCK_SERVICES.find(s => s.name === order.service_name);
      if (found) setSelectedService(found);
    }
  }, []);

  useEffect(() => {
    const total = calcTotal(selectedService, form);
    setForm(prev => ({ ...prev, total_amount: total }));
  }, [form.weight, form.total_clothes, selectedService]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleServiceSelect = (serviceName) => {
    const svc = MOCK_SERVICES.find(s => s.name === serviceName);
    setSelectedService(svc || null);
    set('service_name', serviceName);
    set('unit', svc?.unit || 'kg');
  };

  const handleCustomerSelect = (customer) => {
    setCustomerInput(customer.name);
    setForm(prev => ({
      ...prev,
      customer_name:  customer.name,
      customer_phone: customer.phone   || prev.customer_phone,
      address:        customer.address || prev.address,
    }));
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = customerInput
    ? customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase()))
    : customers;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name)  return alert('Nama customer wajib diisi');
    if (!form.customer_phone) return alert('No. HP wajib diisi');
    const unit = selectedService?.unit || form.unit;
    if (unit === 'kg'  && !(parseFloat(form.weight) > 0))        return alert('Berat harus lebih dari 0');
    if (unit === 'pcs' && !(parseFloat(form.total_clothes) > 0)) return alert('Jumlah pakaian harus lebih dari 0');

    setSaving(true);
    await onSave?.({
      ...form,
      customer_name: form.customer_name || customerInput,
      latitude:      parseFloat(form.latitude),
      longitude:     parseFloat(form.longitude),
      total_amount:  calcTotal(selectedService, form),
      weight:        parseFloat(form.weight)        || undefined,
      total_clothes: parseFloat(form.total_clothes) || undefined,
    });
    setSaving(false);
  };

  const unit = selectedService?.unit || form.unit || 'kg';

  return createPortal(
    <div className="ofd-overlay" onClick={onClose}>
      <div className="ofd-dialog" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ofd-header">
          <h2 className="ofd-title">{order ? 'Edit Order' : 'New Order'}</h2>
          <button className="ofd-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* OCR */}
        {!order && (
          <div className="ofd-ocr-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="ofd-hidden-input"
              onChange={() => {}}
            />
            <button
              type="button"
              className="ofd-ocr-btn"
              disabled={ocrLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {ocrLoading
                ? <><Loader2 size={16} className="ofd-spin" /> Scanning dengan AI...</>
                : <><Sparkles size={16} /> Scan Nota / Struk dengan AI OCR</>
              }
            </button>
          </div>
        )}

        {/* Form */}
        <form className="ofd-form" onSubmit={handleSubmit}>

          {/* Order ID + Pickup Date */}
          <div className="ofd-grid-2">
            <div className="ofd-field">
              <label className="ofd-label">Order ID</label>
              <input
                className="ofd-input"
                value={form.order_id}
                onChange={e => set('order_id', e.target.value)}
              />
            </div>
            <div className="ofd-field">
              <label className="ofd-label">Tanggal Pickup</label>
              <input
                className="ofd-input"
                type="date"
                value={form.pickup_date}
                min={today}
                max={today}
                onChange={e => set('pickup_date', e.target.value)}
              />
            </div>
          </div>

          {/* Customer dengan dropdown */}
          <div className="ofd-field ofd-relative">
            <label className="ofd-label">Nama Customer *</label>
            <input
              className="ofd-input"
              value={customerInput}
              placeholder="Ketik atau pilih customer..."
              required
              onChange={e => {
                setCustomerInput(e.target.value);
                set('customer_name', e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="ofd-dropdown">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="ofd-dropdown-item"
                    onMouseDown={() => handleCustomerSelect(c)}
                  >
                    <span className="ofd-dropdown-name">{c.name}</span>
                    {c.phone && <span className="ofd-dropdown-phone">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Phone + Address */}
          <div className="ofd-grid-2">
            <div className="ofd-field">
              <label className="ofd-label">No. HP *</label>
              <input
                className="ofd-input"
                value={form.customer_phone}
                onChange={e => set('customer_phone', e.target.value)}
                required
              />
            </div>
            <div className="ofd-field">
              <label className="ofd-label">Alamat *</label>
              <input
                className="ofd-input"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Service */}
          <div className="ofd-field">
            <label className="ofd-label">Layanan</label>
            <select
              className="ofd-select"
              value={form.service_name}
              onChange={e => handleServiceSelect(e.target.value)}
            >
              <option value="">-- Pilih Layanan --</option>
              {MOCK_SERVICES.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.unit}) — Rp {(s.price || 0).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Weight atau Pcs */}
          {unit === 'kg' ? (
            <div className="ofd-field">
              <label className="ofd-label">Berat (kg)</label>
              <input
                className="ofd-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="cth: 3.5"
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
              />
            </div>
          ) : (
            <div className="ofd-field">
              <label className="ofd-label">Jumlah Pakaian (pcs)</label>
              <input
                className="ofd-input"
                type="number"
                min="0"
                step="1"
                placeholder="cth: 10"
                value={form.total_clothes}
                onChange={e => set('total_clothes', e.target.value)}
              />
            </div>
          )}

          {/* Total (readonly) */}
          <div className="ofd-field">
            <label className="ofd-label">Total (otomatis)</label>
            <input
              className="ofd-input ofd-input-readonly"
              value={`Rp ${(form.total_amount || 0).toLocaleString('id-ID')}`}
              readOnly
            />
          </div>

          {/* Status + Employee */}
          <div className="ofd-grid-2">
            <div className="ofd-field">
              <label className="ofd-label">Status</label>
              <select
                className="ofd-select"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="ofd-field">
              <label className="ofd-label">Karyawan</label>
              <select
                className="ofd-select"
                value={form.assigned_employee}
                onChange={e => set('assigned_employee', e.target.value)}
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.name}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment */}
          <div className="ofd-grid-2">
            <div className="ofd-field">
              <label className="ofd-label">Status Pembayaran</label>
              <select
                className="ofd-select"
                value={form.payment_status}
                onChange={e => set('payment_status', e.target.value)}
              >
                {PAYMENT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s === 'paid' ? 'Lunas' : 'Belum Bayar'}
                  </option>
                ))}
              </select>
            </div>
            <div className="ofd-field">
              <label className="ofd-label">Metode Pembayaran</label>
              <select
                className="ofd-select"
                value={form.payment_method}
                onChange={e => set('payment_method', e.target.value)}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="ofd-field">
            <label className="ofd-label">Catatan</label>
            <input
              className="ofd-input"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Instruksi khusus..."
            />
          </div>

          {/* Footer */}
          <div className="ofd-footer">
            <button type="button" className="ofd-btn-cancel" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="ofd-btn-save" disabled={saving}>
              {saving ? 'Menyimpan...' : order ? 'Update' : 'Buat Order'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}