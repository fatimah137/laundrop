import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../context/AppContext";
import Layout from '../../../components/Customer/Layout';
import PageTitle from "../../../components/ui/PageTitle";
import TrackOrderModal from "../../../components/Customer/Orders/TrackOrderModal";
import OrderReceiptModal from "../../../components/Customer/Orders/OrderReceiptModal";
import "./Order.css";

/* ── Data ────────────────────────────────────────────────────────── */
const SERVICES = [
  { id: "Cuci + Setrika",   label: "Cuci + Setrika",   desc: "Mencuci dan menyetrika pakaian",       pricePerKg: 10000, unit: "kg",  duration: "2–3 hari" },
  { id: "Cuci Saja",        label: "Cuci Saja",         desc: "Hanya mencuci pakaian",                pricePerKg: 5000,  unit: "kg",  duration: "2–3 hari" },
  { id: "Dry Cleaning",     label: "Dry Cleaning",      desc: "Untuk pakaian premium dan formal",     pricePerKg: 40000, unit: "pcs", duration: "3–5 hari" },
  { id: "Express (24 Jam)", label: "Express (24 Jam)",  desc: "Selesai dalam 24 jam",                 pricePerKg: 15000, unit: "kg",  duration: "24 jam"   },
];

const ITEMS         = ["Shirts","Pants","Dresses","Jackets","Suits","Bedsheets","Towels","Shoes","Other"];
const PICKUP_TIMES  = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00"];
const PAYMENT_METHODS = [
  { id: "Cash", label: "Cash (Tunai)" },
  { id: "QRIS", label: "QRIS" },
];

const today = new Date().toISOString().split("T")[0];
const formatRp = (n) => `Rp ${n.toLocaleString("id-ID")}`;

/* ── Icons (inline SVG) ──────────────────────────────────────────── */
function IconBag() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconMapPinLg() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconWeight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="7" r="4"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}

function IconHash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4"  y1="9"  x2="20" y2="9"/>
      <line x1="4"  y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3"  x2="8"  y2="21"/>
      <line x1="16" y1="3"  x2="14" y2="21"/>
    </svg>
  );
}

function IconNote() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

function IconCash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    </svg>
  );
}

function IconQris() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3"  y="3"  width="7" height="7"/>
      <rect x="14" y="3"  width="7" height="7"/>
      <rect x="3"  y="14" width="7" height="7"/>
      <rect x="14" y="14" width="4" height="4"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────────────── */
export default function Order() {
  const navigate = useNavigate();
  const { addOrder } = useApp();

  const [placedOrder,   setPlacedOrder]   = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showReceipt,   setShowReceipt]   = useState(false);

  const [form, setForm] = useState({
    service:         "Cuci + Setrika",
    pickupAddress:   "",
    deliveryAddress: "",
    pickupDate:      today,
    pickupTime:      "10:00",
    items:           [],
    weight:          "",
    clothesCount:    "",
    notes:           "",
    paymentMethod:   "Cash",
  });

  const selectedService  = SERVICES.find(s => s.id === form.service);
  const estimatedPrice   = selectedService && form.weight
    ? parseFloat(form.weight) * selectedService.pricePerKg
    : 0;

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleItem = (item) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.includes(item)
        ? prev.items.filter(i => i !== item)
        : [...prev.items, item],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const order = addOrder({
      ...form,
      weight: parseFloat(form.weight),
      price:  estimatedPrice,
    });
    setPlacedOrder(order);
    setShowReceipt(true);
  };

return (
  <Layout>
    <div className="order-page">
      <PageTitle
        title="Place an Order"
        subtitle="Fill in the details and we'll take care of the rest."
      />

      <form className="order-form" onSubmit={handleSubmit}>

        {/* 1. Pilih Layanan */}
        <div className="order-section">
          <h3 className="section-title">
            <IconBag /> Select Service
          </h3>
          <div className="service-grid">
            {SERVICES.map(s => (
              <button
                key={s.id}
                type="button"
                className={`service-card ${form.service === s.id ? "active" : ""}`}
                onClick={() => set("service", s.id)}
              >
                <p className="service-card-name">{s.label}</p>
                <p className="service-card-desc">{s.desc}</p>
                <p className="service-card-price">
                  Rp {s.pricePerKg.toLocaleString("id-ID")}/{s.unit}
                </p>
                <p className="service-card-dur">{s.duration}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Jadwal Penjemputan */}
        <div className="order-section">
          <h3 className="section-title">
            <IconCalendar /> Jadwal Penjemputan
          </h3>
          <div className="pickup-grid">
            <div className="form-field">
              <label className="form-label">Tanggal (Hari ini)</label>
              <input
                type="date"
                value={today}
                readOnly
                className="form-input disabled"
              />
              <span className="form-hint">Hanya tersedia hari ini</span>
            </div>
            <div className="form-field">
              <label className="form-label">Waktu Penjemputan</label>
              <select
                required
                value={form.pickupTime}
                onChange={e => set("pickupTime", e.target.value)}
                className="form-select"
              >
                {PICKUP_TIMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="form-hint">10:00 – 14:00</span>
            </div>
          </div>
        </div>

        {/* 3. Alamat */}
        <div className="order-section">
          <h3 className="section-title">
            <IconMapPin /> Alamat
          </h3>

          {/* Map placeholder */}
          <div className="map-placeholder">
            <div className="map-grid-lines" />
            <span className="map-placeholder-icon"><IconMapPinLg /></span>
            <p className="map-placeholder-title">Map Picker</p>
            <p className="map-placeholder-sub">Tap to pin your location</p>
          </div>

          <div className="address-fields">
            <div className="form-field">
              <label className="form-label">Alamat Penjemputan</label>
              <textarea
                required
                rows={2}
                value={form.pickupAddress}
                onChange={e => set("pickupAddress", e.target.value)}
                placeholder="Masukkan alamat lengkap penjemputan..."
                className="form-textarea"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Alamat Pengiriman</label>
              <textarea
                required
                rows={2}
                value={form.deliveryAddress}
                onChange={e => set("deliveryAddress", e.target.value)}
                placeholder="Masukkan alamat pengiriman..."
                className="form-textarea"
              />
            </div>
          </div>
        </div>

        {/* 4. Detail Cucian */}
        <div className="order-section">
          <h3 className="section-title">
            <IconWeight /> Detail Cucian
          </h3>

          {/* Item chips */}
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Jenis Pakaian</label>
            <div className="items-wrap">
              {ITEMS.map(item => (
                <button
                  key={item}
                  type="button"
                  className={`item-chip ${form.items.includes(item) ? "selected" : ""}`}
                  onClick={() => toggleItem(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Weight + count */}
          <div className="detail-grid">
            <div className="form-field">
              <label className="form-label">
                <IconHash />
                {selectedService?.unit === "pcs" ? "Jumlah (pcs)" : "Estimasi Berat (kg)"}
              </label>
              <input
                required
                type="number"
                min="0.5"
                step={selectedService?.unit === "pcs" ? "1" : "0.5"}
                value={form.weight}
                onChange={e => set("weight", e.target.value)}
                placeholder={selectedService?.unit === "pcs" ? "e.g. 3" : "e.g. 3.5"}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">
                <IconHash /> Jumlah Pakaian
              </label>
              <input
                type="number"
                min="1"
                value={form.clothesCount}
                onChange={e => set("clothesCount", e.target.value)}
                placeholder="e.g. 10"
                className="form-input"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-field">
            <label className="form-label">
              <IconNote /> Catatan (opsional)
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Instruksi khusus..."
              className="form-textarea"
            />
          </div>
        </div>

        {/* 5. Metode Pembayaran */}
        <div className="order-section">
          <h3 className="section-title">
            <IconCard /> Metode Pembayaran
          </h3>
          <div className="payment-grid">
            {PAYMENT_METHODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`payment-option ${form.paymentMethod === id ? "selected" : ""}`}
                onClick={() => set("paymentMethod", id)}
              >
                <div className="payment-icon">
                  {id === "Cash" ? <IconCash /> : <IconQris />}
                </div>
                <span className="payment-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Ringkasan Pesanan */}
        <div className="summary-card">
          <h3 className="summary-title">📋 Ringkasan Pesanan</h3>
          <div className="summary-rows">
            {[
              { label: "Layanan",        value: selectedService?.label || "-" },
              { label: "Jadwal",         value: form.pickupTime ? `${today} · ${form.pickupTime}` : "-" },
              { label: "Berat/Pcs",      value: form.weight ? `${form.weight} ${selectedService?.unit || "kg"}` : "-" },
              { label: "Jumlah Pakaian", value: form.clothesCount ? `${form.clothesCount} pcs` : "-" },
              { label: "Alamat",         value: form.pickupAddress || "-" },
              { label: "Pembayaran",     value: form.paymentMethod },
            ].map(({ label, value }) => (
              <div key={label} className="summary-row">
                <span className="summary-row-label">{label}</span>
                <span className="summary-row-value">{value}</span>
              </div>
            ))}

            <hr className="summary-divider" />

            <div className="summary-total-row">
              <span className="summary-total-label">Estimasi Harga</span>
              <span className="summary-total-price">
                {estimatedPrice > 0 ? formatRp(estimatedPrice) : "-"}
              </span>
            </div>

            {estimatedPrice > 0 && (
              <p className="summary-calc">
                {form.weight} {selectedService?.unit} × Rp {selectedService?.pricePerKg?.toLocaleString("id-ID")}/{selectedService?.unit}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn-confirm">
          Confirm Order
        </button>
      </form>

      {/* Receipt Modal */}
      {showReceipt && placedOrder && (
        <OrderReceiptModal
          order={placedOrder}
          onClose={() => setShowReceipt(false)}
          onNewOrder={() => navigate("/")}
          onTrack={() => {
            setShowReceipt(false);
            setTrackingOrder(placedOrder);
          }}
        />
      )}

      {/* Track Modal */}
      {trackingOrder && (
        <TrackOrderModal
          order={trackingOrder}
          onClose={() => { setTrackingOrder(null); navigate("/history"); }}
        />
      )}
    </div>
      </Layout> 
  );
}