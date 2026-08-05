import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_SERVICES, MOCK_EMPLOYEES } from '../../../data/mockData';
import api from '../../../services/api';
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
  const [saving, setSaving]                             = useState(false);
  const [customers, setCustomers]                       = useState([]);
  const [allCustomers, setAllCustomers]                 = useState([]);
  const [customersLoading, setCustomersLoading]         = useState(true);
  const [services, setServices]                         = useState([]);
  const [allServices, setAllServices]                   = useState([]);
  const [servicesLoading, setServicesLoading]           = useState(true);
  const [customerInput, setCustomerInput]               = useState(order?.customer_name || '');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedService, setSelectedService]           = useState(null);

  // DEBUG: Log employees prop
  useEffect(() => {
    console.log('🔍 OrderFormDialog received employees:', employees);
  }, [employees]);

  // Fetch customers dan services dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Fetching customers from API...');
        const customerResponse = await api.get('/customers/search', { params: { per_page: 100 } });
        console.log('✅ Full Customer Response:', customerResponse);
        
        const data = customerResponse?.data?.data;
        let customersData = [];
        
        if (Array.isArray(data)) {
          customersData = data;
        } else if (data?.data && Array.isArray(data.data)) {
          customersData = data.data;
        } else if (customerResponse?.data?.data?.data && Array.isArray(customerResponse.data.data.data)) {
          customersData = customerResponse.data.data.data;
        }
        
        console.log('📋 Extracted customers array:', customersData);
        
        const mappedCustomers = customersData.map(customer => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
        }));
        
        if (mappedCustomers.length > 0) {
          setAllCustomers(mappedCustomers);
          setCustomers(mappedCustomers);
          console.log('✅ Using API customers:', mappedCustomers);
        } else {
          setAllCustomers(MOCK_CUSTOMERS);
          setCustomers(MOCK_CUSTOMERS);
          console.log('⚠️ API empty, using MOCK_CUSTOMERS');
        }
      } catch (err) {
        console.error('❌ Failed to fetch customers from API:', err?.response?.data || err?.message);
        setAllCustomers(MOCK_CUSTOMERS);
        setCustomers(MOCK_CUSTOMERS);
        console.log('⚠️ API error, using MOCK_CUSTOMERS');
      } finally {
        setCustomersLoading(false);
      }

      try {
        console.log('🔄 Fetching services from API...');
        const serviceResponse = await api.get('/services');
        console.log('✅ Full Service Response:', serviceResponse);
        
        const servicesData = serviceResponse?.data?.data || [];
        
        const mappedServices = servicesData.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: parseFloat(service.price_per_kg),
          unit: service.unit || 'kg',
          duration: `${service.est_duration_hours}h`,
        }));
        
        if (mappedServices.length > 0) {
          setAllServices(mappedServices);
          setServices(mappedServices);
          console.log('✅ Using REAL API services (from database):', mappedServices);
        } else {
          setAllServices([]);
          setServices([]);
          console.log('⚠️ No services available from API - showing empty list');
        }
      } catch (err) {
        console.error('❌ Failed to fetch services from API:', err?.response?.data || err?.message);
        setAllServices([]);
        setServices([]);
        console.log('⚠️ API error - showing empty list (NOT using mock data)');
      } finally {
        setServicesLoading(false);
      }
    };

    fetchData();
  }, []);

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
    if (order?.service_name && services.length > 0) {
      const found = services.find(s => s.name === order.service_name);
      if (found) setSelectedService(found);
    }
  }, [services]);

  useEffect(() => {
    const total = calcTotal(selectedService, form);
    setForm(prev => ({ ...prev, total_amount: total }));
  }, [form.weight, form.total_clothes, selectedService]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleServiceSelect = (serviceName) => {
    const svc = services.find(s => s.name === serviceName);
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

  const handleCustomerInputChange = (value) => {
    setCustomerInput(value);
    set('customer_name', value);

    // Client-side filtering dari allCustomers
    if (value.trim().length > 0) {
      const filtered = allCustomers.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase()) ||
        c.phone.toLowerCase().includes(value.toLowerCase())
      );
      setCustomers(filtered.length > 0 ? filtered : allCustomers);
      console.log(`🔍 Filtered "${value}":`, filtered);
    } else {
      // Reset ke initial customers list jika input kosong
      setCustomers(allCustomers);
      console.log('Reset ke all customers');
    }
  };

  const filteredCustomers = customers.slice(0, 5);  // Limit to 5 results

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
          <h2 className="ofd-title">{order ? 'Edit Order' : 'Pesanan Drop Off'}</h2>
          <button className="ofd-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <form className="ofd-form" onSubmit={handleSubmit}>

          {/* Order ID + Pickup Date (Read-only untuk drop-off) */}
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
              <label className="ofd-label">Tanggal Masuk (Hari Ini)</label>
              <input
                className="ofd-input ofd-input-readonly"
                type="date"
                value={form.pickup_date}
                readOnly
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
              onChange={e => handleCustomerInputChange(e.target.value)}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
            />
            {showCustomerDropdown && (
              <div className="ofd-dropdown">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="ofd-dropdown-item"
                      onMouseDown={() => handleCustomerSelect(c)}
                    >
                      <span className="ofd-dropdown-name">{c.name}</span>
                      {c.phone && <span className="ofd-dropdown-phone">{c.phone}</span>}
                    </button>
                  ))
                ) : (
                  <div className="ofd-dropdown-item" style={{ color: '#999', textAlign: 'center', padding: '8px' }}>
                    Tidak ada customer ditemukan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phone + Notes */}
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
              <label className="ofd-label">Alamat Pengiriman</label>
              <input
                className="ofd-input"
                placeholder="Opsional - jika ada pengiriman"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </div>
          </div>

          {/* Service */}
          <div className="ofd-field">
            <label className="ofd-label">Layanan {servicesLoading && '⏳'}</label>
            {services.length === 0 ? (
              <div className="ofd-input" style={{ color: '#999', padding: '8px' }}>
                {servicesLoading ? 'Memuat layanan dari database...' : '❌ Tidak ada layanan tersedia'}
              </div>
            ) : (
              <select
                className="ofd-select"
                value={form.service_name}
                onChange={e => handleServiceSelect(e.target.value)}
                disabled={servicesLoading}
              >
                <option value="">-- Pilih Layanan --</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.unit}) — Rp {(s.price || 0).toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            )}
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