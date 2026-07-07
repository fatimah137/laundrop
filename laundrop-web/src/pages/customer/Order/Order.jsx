import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useApp } from "../../../context/AppContext";
import api from "../../../services/api";
import Layout from '../../../components/Customer/Layout';
import PageTitle from "../../../components/ui/PageTitle";
import TrackOrderModal from "../../../components/Customer/Orders/TrackOrderModal";
import OrderReceiptModal from "../../../components/Customer/Orders/OrderReceiptModal";
import QRISModal from "../../../components/Customer/Orders/QRISModal"; // ✅ tambah
import "leaflet/dist/leaflet.css";
import "./Order.css";

const FALLBACK_SERVICES = [
  { id: "Cuci + Setrika",   label: "Cuci + Setrika",   desc: "Mencuci dan menyetrika pakaian",       pricePerKg: 10000, unit: "kg",  duration: "2–3 hari" },
  { id: "Cuci Saja",        label: "Cuci Saja",         desc: "Hanya mencuci pakaian",                pricePerKg: 5000,  unit: "kg",  duration: "2–3 hari" },
  { id: "Dry Cleaning",     label: "Dry Cleaning",      desc: "Untuk pakaian premium dan formal",     pricePerKg: 40000, unit: "pcs", duration: "3–5 hari" },
  { id: "Express (24 Jam)", label: "Express (24 Jam)",  desc: "Selesai dalam 24 jam",                 pricePerKg: 15000, unit: "kg",  duration: "24 jam"   },
];

const ITEMS           = ["Shirts","Pants","Dresses","Jackets","Suits","Bedsheets","Towels","Shoes","Other"];
const PICKUP_TIMES    = ["10:00","11:00","12:00","13:00","14:00"];
const PAYMENT_METHODS = [
  { id: "Cash", label: "Cash (Tunai)", desc: "Bayar saat laundry diantar" },
  { id: "QRIS", label: "QRIS",         desc: "Bayar via QR Code" },
];
const SERVICE_DISTRICTS = ["tembalang", "banyumanik"];
const LAUNDRY_COORDINATE = { lat: -7.0715116551644055, lng: 110.41728959200246 };
const DELIVERY_FEE_PER_KM = 3000;

const today    = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString().split("T")[0];
const formatRp = (n) => `Rp ${n.toLocaleString("id-ID")}`;
const DEFAULT_MAP_CENTER = LAUNDRY_COORDINATE;

const formatDuration = (hours) => {
  const value = Number(hours || 0);
  if (!value) return "Estimasi tersedia";
  if (value % 24 === 0) {
    const days = value / 24;
    return `${days} hari`;
  }
  return `${value} jam`;
};

const timeToMinutes = (timeStr) => {
  const [h, m] = String(timeStr).split(":").map(Number);
  return (h * 60) + m;
};

const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const mapMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const extractPolygonsFromGeoJson = (geoJson) => {
  if (!geoJson || !geoJson.type || !geoJson.coordinates) return [];

  if (geoJson.type === "Polygon") {
    const outerRing = geoJson.coordinates?.[0] ?? [];
    return [outerRing.map(([lng, lat]) => ({ lat, lng }))];
  }

  if (geoJson.type === "MultiPolygon") {
    return geoJson.coordinates
      .map((polygon) => {
        const outerRing = polygon?.[0] ?? [];
        return outerRing.map(([lng, lat]) => ({ lat, lng }));
      })
      .filter((ring) => ring.length > 0);
  }

  return [];
};

const isPointInPolygon = (point, polygon) => {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi) / ((yj - yi) || 1e-12)) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

const isPointInAnyPolygon = (point, polygons) => polygons.some((polygon) => isPointInPolygon(point, polygon));


function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      const { lat, lng } = event.latlng;
      onSelect(lat, lng);
    },
  });

  return null;
}

function MapCenterUpdater({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);

  return null;
}

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

const createBlankForm = () => ({
  service:         "Cuci + Setrika",
  pickupAddress:   "",
  deliveryAddress: "",
  pickupDistrict:  "",
  isServiceAreaValid: false,
  distanceFromLaundryKm: 0,
  extraFee:        0,
  pickupLat:       null,
  pickupLng:       null,
  pickupDate:      today,
  pickupTime:      "10:00",
  items:           [],
  weight:          "",
  clothesCount:    "",
  notes:           "",
  paymentMethod:   "Cash",
});

export default function Order() {
  const navigate = useNavigate();
  const { addOrder, confirmPayment } = useApp(); // ✅ tambah confirmPayment

  const [placedOrder,   setPlacedOrder]   = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showReceipt,   setShowReceipt]   = useState(false);
  const [qrisOrder,     setQrisOrder]     = useState(null); // ✅ tambah

  const [form, setForm] = useState(createBlankForm);
  const [now, setNow] = useState(() => new Date());
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [mapError, setMapError] = useState("");
  const [serviceAreaPolygons, setServiceAreaPolygons] = useState([]);
  const [loadingServiceArea, setLoadingServiceArea] = useState(true);
  const [manualGeocodingLoading, setManualGeocodingLoading] = useState(false);
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      setLoadingServices(true);
      setServicesError("");
      try {
        const response = await api.get("/services");
        const rows = response?.data?.data ?? [];
        const mapped = rows.map((item) => ({
          id: String(item.id),
          label: item.name,
          desc: item.description || "Layanan laundry profesional",
          pricePerKg: Number(item.price_per_kg || 0),
          unit: "kg",
          duration: formatDuration(item.est_duration_hours),
        }));

        if (!mounted) return;

        if (mapped.length > 0) {
          setServices(mapped);
        } else {
          setServices(FALLBACK_SERVICES);
          setServicesError("Belum ada layanan aktif dari database.");
        }
      } catch {
        if (!mounted) return;
        setServices(FALLBACK_SERVICES);
        setServicesError("Gagal mengambil layanan dari database. Menampilkan data cadangan.");
      } finally {
        if (mounted) setLoadingServices(false);
      }
    };

    fetchServices();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchServiceAreaBoundaries = async () => {
      setLoadingServiceArea(true);
      try {
        const headers = { "User-Agent": "laundrop-dev" };
        const banyumanikUrl = "https://nominatim.openstreetmap.org/search?q=Banyumanik%2C+Semarang%2C+Indonesia&format=jsonv2&polygon_geojson=1&limit=1";
        const tembalangUrl = "https://nominatim.openstreetmap.org/search?q=Tembalang%2C+Semarang%2C+Indonesia&format=jsonv2&polygon_geojson=1&limit=1";

        const [banyumanikRes, tembalangRes] = await Promise.all([
          fetch(banyumanikUrl, { headers }),
          fetch(tembalangUrl, { headers }),
        ]);

        if (!banyumanikRes.ok || !tembalangRes.ok) {
          throw new Error("Boundary fetch failed");
        }

        const [banyumanikData, tembalangData] = await Promise.all([
          banyumanikRes.json(),
          tembalangRes.json(),
        ]);

        const polygons = [
          ...extractPolygonsFromGeoJson(banyumanikData?.[0]?.geojson),
          ...extractPolygonsFromGeoJson(tembalangData?.[0]?.geojson),
        ];

        if (!mounted) return;
        setServiceAreaPolygons(polygons);
      } catch {
        if (!mounted) return;
        setServiceAreaPolygons([]);
      } finally {
        if (mounted) setLoadingServiceArea(false);
      }
    };

    fetchServiceAreaBoundaries();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePickupFromCoordinates = async (lat, lng) => {
    const distanceFromLaundryKm = calculateDistanceKm(
      LAUNDRY_COORDINATE.lat,
      LAUNDRY_COORDINATE.lng,
      lat,
      lng
    );
    const extraFee = Math.round(distanceFromLaundryKm * DELIVERY_FEE_PER_KM);

    setForm((prev) => ({
      ...prev,
      pickupLat: Number(lat.toFixed(6)),
      pickupLng: Number(lng.toFixed(6)),
      distanceFromLaundryKm: Number(distanceFromLaundryKm.toFixed(2)),
      extraFee,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding OSM gagal");
      }

      const payload = await response.json();
      if (payload?.display_name) {
        const districtRaw =
          payload?.address?.city_district ||
          payload?.address?.suburb ||
          payload?.address?.town ||
          payload?.address?.city ||
          payload?.address?.county ||
          "";
        const district = String(districtRaw || "").trim();
        const isInsideServiceAreaByDistrict = SERVICE_DISTRICTS.some((name) =>
          district.toLowerCase().includes(name)
        );
        const isInsideServiceAreaByPolygon = serviceAreaPolygons.length > 0
          ? isPointInAnyPolygon({ lat, lng }, serviceAreaPolygons)
          : false;
        const isServiceAreaValid = serviceAreaPolygons.length > 0
          ? isInsideServiceAreaByPolygon
          : isInsideServiceAreaByDistrict;

        setForm((prev) => ({
          ...prev,
          pickupAddress: payload.display_name,
          pickupDistrict: district,
          isServiceAreaValid,
        }));
        setLastGeocodedAddress(payload.display_name);

        if (!isServiceAreaValid) {
          setMapError("Mohon pilih titik di kecamatan Tembalang atau Banyumanik saja.");
        } else {
          setMapError("");
        }
      }
    } catch {
      setMapError("Titik berhasil dipilih, tapi alamat otomatis gagal diambil. Silakan isi alamat manual.");
    }
  };

  const geocodeManualPickupAddress = async () => {
    const address = String(form.pickupAddress || "").trim();
    if (!address || address === lastGeocodedAddress) return;

    try {
      setManualGeocodingLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=id&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error("Geocoding alamat gagal");
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        setMapError("Alamat tidak ditemukan di map. Coba perjelas nama jalan/daerah.");
        return;
      }

      const first = results[0];
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setMapError("Alamat ditemukan tetapi koordinat tidak valid.");
        return;
      }

      await updatePickupFromCoordinates(lat, lng);
      setLastGeocodedAddress(address);
    } catch {
      setMapError("Gagal sinkronkan alamat manual ke map. Silakan coba lagi.");
    } finally {
      setManualGeocodingLoading(false);
    }
  };

  const currentMinutes = (now.getHours() * 60) + now.getMinutes();
  const isPickupToday = form.pickupDate === today;
  const availablePickupTimes = useMemo(
    () => (isPickupToday
      ? PICKUP_TIMES.filter((time) => timeToMinutes(time) > currentMinutes)
      : PICKUP_TIMES),
    [currentMinutes, isPickupToday]
  );

  useEffect(() => {
    if (services.length === 0) return;
    if (!services.some((s) => String(s.id) === String(form.service))) {
      setForm((prev) => ({ ...prev, service: String(services[0].id) }));
    }
  }, [services, form.service]);

  const selectedService = services.find(s => String(s.id) === String(form.service));
  const canSubmitOrder = Boolean(form.isServiceAreaValid && form.pickupAddress && selectedService);
  const pickupPosition = useMemo(
    () => ({
      lat: typeof form.pickupLat === "number" ? form.pickupLat : DEFAULT_MAP_CENTER.lat,
      lng: typeof form.pickupLng === "number" ? form.pickupLng : DEFAULT_MAP_CENTER.lng,
    }),
    [form.pickupLat, form.pickupLng]
  );

  const estimatedPrice  = selectedService && form.weight
    ? parseFloat(form.weight) * selectedService.pricePerKg
    : 0;
  const grandTotal = estimatedPrice + Number(form.extraFee || 0);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  useEffect(() => {
    if (!sameAsPickup) return;
    setForm((prev) => ({
      ...prev,
      deliveryAddress: prev.pickupAddress,
    }));
  }, [form.pickupAddress, sameAsPickup]);

  useEffect(() => {
    if (availablePickupTimes.length === 0) return;
    if (!availablePickupTimes.includes(form.pickupTime)) {
      set("pickupTime", availablePickupTimes[0]);
    }
  }, [availablePickupTimes, form.pickupTime]);

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

    if (!selectedService) return;
    if (!form.isServiceAreaValid) {
      setMapError("Order hanya tersedia untuk area kecamatan Tembalang dan Banyumanik.");
      return;
    }

    const order = addOrder({
      ...form,
      deliveryAddress: sameAsPickup ? form.pickupAddress : form.deliveryAddress,
      service: selectedService.label,
      service_id: selectedService.id,
      laundryPrice: estimatedPrice,
      extraFee: Number(form.extraFee || 0),
      isServiceAreaValid: Boolean(form.isServiceAreaValid),
      distanceFromLaundryKm: Number(form.distanceFromLaundryKm || 0),
      weight: parseFloat(form.weight),
      price:  grandTotal,
    });
    setPlacedOrder(order);
    setShowReceipt(true);
  };

  const handleNewOrder = () => {
    setShowReceipt(false);
    setPlacedOrder(null);
    setForm(createBlankForm());
    setSameAsPickup(true);
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
            <h3 className="section-title"><IconBag /> Select Service</h3>
            {loadingServices && <span className="form-hint">Memuat layanan dari database...</span>}
            {servicesError && <span className="form-hint">{servicesError}</span>}
            <div className="service-grid">
              {services.map(s => (
                <button
                  key={s.id} type="button"
                  className={`service-card ${form.service === s.id ? "active" : ""}`}
                  onClick={() => set("service", s.id)}
                >
                  <p className="service-card-name">{s.label}</p>
                  <p className="service-card-desc">{s.desc}</p>
                  <p className="service-card-price">Rp {s.pricePerKg.toLocaleString("id-ID")}/{s.unit}</p>
                  <p className="service-card-dur">{s.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Jadwal Penjemputan */}
          <div className="order-section">
            <h3 className="section-title"><IconCalendar /> Jadwal Penjemputan</h3>
            <div className="pickup-grid">
              <div className="form-field">
                <label className="form-label">Tanggal Penjemputan</label>
                <select
                  required
                  value={form.pickupDate}
                  onChange={e => set("pickupDate", e.target.value)}
                  className="form-select"
                >
                  <option value={today}>Hari ini ({formatDateLabel(today)})</option>
                  <option value={tomorrow}>Besok ({formatDateLabel(tomorrow)})</option>
                </select>
                <span className="form-hint">Tersedia untuk hari ini dan besok</span>
              </div>
              <div className="form-field">
                <label className="form-label">Waktu Penjemputan</label>
                <select
                  required
                  value={form.pickupTime}
                  onChange={e => set("pickupTime", e.target.value)}
                  className="form-select"
                  disabled={availablePickupTimes.length === 0}
                >
                  {PICKUP_TIMES.map((t) => {
                    const disabled = isPickupToday && timeToMinutes(t) <= currentMinutes;
                    return (
                      <option key={t} value={t} disabled={disabled}>
                        {t}{disabled ? " (sudah lewat)" : ""}
                      </option>
                    );
                  })}
                </select>
                <span className="form-hint">
                  {!isPickupToday
                    ? "Semua jam tersedia untuk jadwal besok"
                    : availablePickupTimes.length > 0
                    ? "Jam yang sudah lewat otomatis tidak bisa dipilih"
                    : "Semua jam penjemputan hari ini sudah lewat"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Alamat */}
          <div className="order-section">
            <h3 className="section-title"><IconMapPin /> Alamat</h3>
            {mapError && <div className="map-error-box">{mapError}</div>}
            {loadingServiceArea && (
              <p className="form-hint" style={{ marginBottom: 8 }}>
                Memuat boundary kecamatan resmi...
              </p>
            )}
            <div className="map-picker-wrap">
              <MapContainer
                center={[pickupPosition.lat, pickupPosition.lng]}
                zoom={14}
                className="map-canvas"
                scrollWheelZoom
              >
                <MapCenterUpdater lat={pickupPosition.lat} lng={pickupPosition.lng} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  icon={mapMarkerIcon}
                  position={[pickupPosition.lat, pickupPosition.lng]}
                  draggable
                  eventHandlers={{
                    dragend: (event) => {
                      const { lat, lng } = event.target.getLatLng();
                      updatePickupFromCoordinates(lat, lng);
                    },
                  }}
                />
                <MapClickHandler onSelect={updatePickupFromCoordinates} />
              </MapContainer>
            </div>
            <p className="map-coord-hint">
              Koordinat titik: {form.pickupLat ?? "-"}, {form.pickupLng ?? "-"}
            </p>
            {form.pickupDistrict && (
              <p className="map-area-hint">
                Kecamatan terdeteksi: {form.pickupDistrict}
              </p>
            )}
            {form.pickupDistrict && (
              <p className="map-area-hint">
                Jarak dari Laundry: {Number(form.distanceFromLaundryKm || 0).toFixed(2)} km
              </p>
            )}
            {form.pickupDistrict && form.isServiceAreaValid && (
              <div className="map-area-warning">
                Area valid untuk pemesanan. Biaya antar-jemput dihitung ${formatRp(DELIVERY_FEE_PER_KM)} per km dari Laundry.
              </div>
            )}
            {form.pickupDistrict && !form.isServiceAreaValid && (
              <div className="map-area-danger">
                Area tidak valid. Order hanya bisa dibuat dari kecamatan Tembalang atau Banyumanik.
              </div>
            )}
            <div className="address-fields">
              <div className="form-field">
                <label className="form-label">Alamat Penjemputan</label>
                <textarea
                  required
                  rows={2}
                  value={form.pickupAddress}
                  onChange={e => set("pickupAddress", e.target.value)}
                  onBlur={geocodeManualPickupAddress}
                  placeholder="Masukkan alamat lengkap penjemputan..."
                  className="form-textarea"
                />
                <span className="form-hint">
                  {manualGeocodingLoading
                    ? "Mencari lokasi dari alamat manual..."
                    : "Alamat manual akan sinkron ke map saat field selesai diisi"}
                </span>
              </div>
              <label className="same-address-toggle">
                <input
                  type="checkbox"
                  checked={sameAsPickup}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSameAsPickup(checked);
                    if (checked) {
                      setForm((prev) => ({
                        ...prev,
                        deliveryAddress: prev.pickupAddress,
                      }));
                    }
                  }}
                />
                <span>Sama dengan alamat penjemputan</span>
              </label>
              <div className="form-field">
                <label className="form-label">Alamat Pengiriman</label>
                <textarea
                  required
                  rows={2}
                  value={form.deliveryAddress}
                  onChange={e => set("deliveryAddress", e.target.value)}
                  placeholder="Masukkan alamat pengiriman..."
                  className="form-textarea"
                  disabled={sameAsPickup}
                />
              </div>
            </div>
          </div>

          {/* 4. Detail Cucian */}
          <div className="order-section">
            <h3 className="section-title"><IconWeight /> Detail Cucian</h3>
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label className="form-label">Jenis Pakaian</label>
              <div className="items-wrap">
                {ITEMS.map(item => (
                  <button key={item} type="button" className={`item-chip ${form.items.includes(item) ? "selected" : ""}`} onClick={() => toggleItem(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="detail-grid">
              <div className="form-field">
                <label className="form-label"><IconHash /> Estimasi Berat (kg)</label>
                <input required type="number" min="0.1" step="0.1" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 2.3" className="form-input" />
                <span className="form-hint">Bisa desimal, cth: 1.5 kg</span>
              </div>
              <div className="form-field">
                <label className="form-label"><IconHash /> Jumlah Pakaian (pcs)</label>
                <input type="number" min="1" step="1" value={form.clothesCount} onChange={e => set("clothesCount", e.target.value)} placeholder="e.g. 10" className="form-input" />
                <span className="form-hint">Jumlah item pakaian</span>
              </div>
            </div>
            <div className="form-field">
              <label className="form-label"><IconNote /> Catatan (opsional)</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Instruksi khusus, misal: jangan pakai pemutih..." className="form-textarea" />
            </div>
          </div>

          {/* 5. Metode Pembayaran */}
          <div className="order-section">
            <h3 className="section-title"><IconCard /> Metode Pembayaran</h3>
            <div className="payment-grid">
              {PAYMENT_METHODS.map(({ id, label, desc }) => (
                <button key={id} type="button" className={`payment-option ${form.paymentMethod === id ? "selected" : ""}`} onClick={() => set("paymentMethod", id)}>
                  <div className="payment-icon">
                    {id === "Cash" ? <IconCash /> : <IconQris />}
                  </div>
                  <div className="payment-text">
                    <span className="payment-label">{label}</span>
                    <span className="payment-desc">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Ringkasan */}
          <div className="summary-card">
            <h3 className="summary-title">📋 Ringkasan Pesanan</h3>
            <div className="summary-rows">
              {[
                { label: "Layanan",        value: selectedService?.label || "-" },
                { label: "Jadwal",         value: form.pickupTime ? `${formatDateLabel(form.pickupDate)} · ${form.pickupTime}` : "-" },
                { label: "Berat",          value: form.weight ? `${form.weight} kg` : "-" },
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
              {form.extraFee > 0 && (
                <div className="summary-total-row summary-total-row-extra">
                  <span className="summary-total-label">Biaya Antar Jemput</span>
                  <span className="summary-total-price summary-extra-fee">+ {formatRp(form.extraFee)}</span>
                </div>
              )}
              <div className="summary-total-row">
                <span className="summary-total-label">Total</span>
                <span className="summary-total-price">
                  {grandTotal > 0 ? formatRp(grandTotal) : "-"}
                </span>
              </div>
              {estimatedPrice > 0 && (
                <p className="summary-calc">
                  {form.weight} kg × Rp {selectedService?.pricePerKg?.toLocaleString("id-ID")}/kg
                </p>
              )}
              <p className="summary-note">
                * Harga final ditentukan setelah employee memverifikasi berat aktual
              </p>
            </div>
          </div>

          <button type="submit" className="btn-confirm" disabled={!canSubmitOrder}>
            Confirm Order
          </button>

        </form>

        {/* Receipt Modal */}
        {showReceipt && placedOrder && (
          <OrderReceiptModal
            order={placedOrder}
            onClose={() => setShowReceipt(false)}
            onNewOrder={handleNewOrder}
            onTrack={() => {
              setShowReceipt(false);
              setTrackingOrder(placedOrder);
            }}
          />
        )}

        {/* ✅ Track Modal — pass onPayQris */}
        {trackingOrder && (
          <TrackOrderModal
            order={trackingOrder}
            onClose={() => {
              setTrackingOrder(null);
              navigate("/customer/history");
            }}
            onPayQris={(o) => {       // ✅ buka QRIS modal dari track modal
              setTrackingOrder(null);
              setQrisOrder(o);
            }}
          />
        )}

        {/* ✅ QRIS Modal */}
        {qrisOrder && (
          <QRISModal
            order={qrisOrder}
            onSuccess={() => {
              confirmPayment(qrisOrder.id);
              setQrisOrder(null);
            }}
            onClose={() => setQrisOrder(null)}
          />
        )}

      </div>
    </Layout>
  );
}