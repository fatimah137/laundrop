import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Phone, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useApp } from "../../../context/AppContext";
import { useRole } from "../../../context/RoleContext";
import api from "../../../services/api";
import Layout from '../../../components/Customer/Layout';
import PageTitle from "../../../components/ui/PageTitle";
import TrackOrderModal from "../../../components/Customer/Orders/TrackOrderModal";
import OrderReceiptModal from "../../../components/Customer/Orders/OrderReceiptModal";
import QRISModal from "../../../components/Customer/Orders/QRISModal"; // ✅ tambah
import "leaflet/dist/leaflet.css";
import "./Order.css";

const ITEMS           = ["Shirts","Pants","Dresses","Jackets","Suits","Bedsheets","Towels","Shoes","Other"];
const PICKUP_TIMES    = ["10:00","11:00","12:00","13:00","14:00"];
const PAYMENT_METHODS = [
  { id: "Cash", label: "Cash (Tunai)", desc: "Bayar saat laundry diantar" },
  { id: "QRIS", label: "QRIS",         desc: "Bayar via QR Code" },
];
const ORDER_TYPES = [
  { id: "pickup", label: "Pickup", desc: "Karyawan mengambil pakaian ke alamat Anda." },
  { id: "drop_off", label: "Drop Off", desc: "Pelanggan mengantar pakaian kotor ke outlet." },
];
const SERVICE_DISTRICTS = ["tembalang", "banyumanik"];
const KNOWN_SUBDISTRICTS = [
  // Banyumanik sub-districts
  "srondol wetan", "srondol", "mangunharjo", "podorejo", "banyumanik", "ngesrep", "padangsari",
  // Tembalang sub-districts
  "tembalang", "sambirejo", "rowosari", "meteseh", "tandang",
];
const LAUNDRY_COORDINATE = { lat: -7.0715116551644055, lng: 110.41728959200246 };
const OUTLET_ADDRESS = "Outlet Laundrop - Tembalang, Semarang";
const OUTLET_COORDINATE = LAUNDRY_COORDINATE;
const DELIVERY_FEE_PER_KM_TIER = 3000;
const SAVED_ADDRESS_STORAGE_KEY = "laundrop_saved_addresses_v1";
const MAX_SAVED_ADDRESSES = 8;

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

const calculateTieredDeliveryFee = (distanceKm) => {
  const distance = Number(distanceKm);
  if (!Number.isFinite(distance) || distance < 0) return 0;

  // Tiered pricing: 0-1 km = 1 tier, >1-2 km = 2 tiers, and so on.
  const tierCount = Math.max(1, Math.ceil(distance));
  return tierCount * DELIVERY_FEE_PER_KM_TIER;
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

const deliveryMarkerIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
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
  orderType:       "pickup",
  service:         "",
  pickupAddress:   "",
  deliveryAddress: "",
  deliveryLat:     null,
  deliveryLng:     null,
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
  const location = useLocation();
  const { confirmPayment } = useApp();
  const { currentUser, updateCurrentUser } = useRole();
  const pickupBackupRef = useRef(null);

  const [placedOrder,   setPlacedOrder]   = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showReceipt,   setShowReceipt]   = useState(false);
  const [qrisOrder,     setQrisOrder]     = useState(null); // ✅ tambah
  
  // Phone completion modal
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [form, setForm] = useState(createBlankForm);
  const [now, setNow] = useState(() => new Date());
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [mapError, setMapError] = useState("");
  const [serviceAreaPolygons, setServiceAreaPolygons] = useState([]);
  const [loadingServiceArea, setLoadingServiceArea] = useState(true);
  const [manualGeocodingLoading, setManualGeocodingLoading] = useState(false);
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const savedAddressStorageSlot = useMemo(() => {
    const userKey = currentUser?.id || currentUser?.email || "guest";
    return `${SAVED_ADDRESS_STORAGE_KEY}:${userKey}`;
  }, [currentUser?.email, currentUser?.id]);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
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
          setServices([]);
          setServicesError("");
        }
      } catch {
        if (!mounted) return;
        setServices([]);
        setServicesError("Gagal mengambil layanan.");
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
    try {
      const raw = localStorage.getItem(savedAddressStorageSlot);
      const parsed = raw ? JSON.parse(raw) : [];
      setSavedAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedAddresses([]);
    }
  }, [savedAddressStorageSlot]);

  // Load selected address from sessionStorage after returning from SavedAddresses page
  useEffect(() => {
    const selectedAddr = sessionStorage.getItem('selected_saved_address');
    const savedFormState = sessionStorage.getItem('order_form_state');
    
    if (selectedAddr) {
      try {
        const addressEntry = JSON.parse(selectedAddr);
        
        // Restore form state if it was saved before navigating
        if (savedFormState) {
          try {
            const restoredForm = JSON.parse(savedFormState);
            setForm(restoredForm);
            
            // Then apply the selected address to the restored form
            setTimeout(() => {
              applySavedAddress(addressEntry);
            }, 0);
          } catch (e) {
            console.error('Failed to restore form state:', e);
            applySavedAddress(addressEntry);
          }
        } else {
          applySavedAddress(addressEntry);
        }
        
        sessionStorage.removeItem('selected_saved_address');
        sessionStorage.removeItem('order_form_state');
      } catch (e) {
        console.error('Invalid saved address:', e);
      }
    }
  }, []);
  // Empty dependency array - only run once on mount

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
    const extraFee = calculateTieredDeliveryFee(distanceFromLaundryKm);

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
        const normalizedDist = district.toLowerCase();
        const isInsideServiceAreaByDistrict = SERVICE_DISTRICTS.some((name) =>
          normalizedDist.includes(name)
        );
        const isInsideServiceAreaBySubdistrict = KNOWN_SUBDISTRICTS.some((name) =>
          normalizedDist.includes(name)
        );
        const isInsideServiceAreaByPolygon = serviceAreaPolygons.length > 0
          ? isPointInAnyPolygon({ lat, lng }, serviceAreaPolygons)
          : false;
        const isServiceAreaValid = serviceAreaPolygons.length > 0
          ? isInsideServiceAreaByPolygon
          : (isInsideServiceAreaByDistrict || isInsideServiceAreaBySubdistrict);

        setForm((prev) => ({
          ...prev,
          pickupAddress: payload.display_name,
          pickupDistrict: district,
          isServiceAreaValid,
          deliveryAddress: prev.orderType === "pickup" ? payload.display_name : prev.deliveryAddress,
          deliveryLat: prev.orderType === "pickup" ? Number(lat.toFixed(6)) : prev.deliveryLat,
          deliveryLng: prev.orderType === "pickup" ? Number(lng.toFixed(6)) : prev.deliveryLng,
          distanceFromLaundryKm,
          extraFee,
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

  const updateDeliveryFromCoordinates = async (lat, lng) => {
    const distanceFromLaundryKm = calculateDistanceKm(
      LAUNDRY_COORDINATE.lat,
      LAUNDRY_COORDINATE.lng,
      lat,
      lng
    );

    setForm((prev) => ({
      ...prev,
      deliveryLat: Number(lat.toFixed(6)),
      deliveryLng: Number(lng.toFixed(6)),
      distanceFromLaundryKm: Number(distanceFromLaundryKm.toFixed(2)),
      extraFee: calculateTieredDeliveryFee(distanceFromLaundryKm),
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
        setForm((prev) => ({
          ...prev,
          deliveryAddress: payload.display_name,
        }));
        setLastGeocodedAddress(payload.display_name);
        setMapError("");
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

  const geocodeManualDeliveryAddress = async () => {
    if (form.orderType !== "drop_off") return;

    const address = String(form.deliveryAddress || "").trim();
    if (!address) return;

    try {
      setManualGeocodingLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=id&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error("Geocoding alamat pengantaran gagal");
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        setMapError("Alamat pengantaran tidak ditemukan di map. Coba perjelas nama jalan/daerah.");
        return;
      }

      const first = results[0];
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setMapError("Alamat pengantaran ditemukan tetapi koordinat tidak valid.");
        return;
      }

      const distanceFromLaundryKm = calculateDistanceKm(
        LAUNDRY_COORDINATE.lat,
        LAUNDRY_COORDINATE.lng,
        lat,
        lng
      );

      setForm((prev) => ({
        ...prev,
        deliveryAddress: address,
        deliveryLat: Number(lat.toFixed(6)),
        deliveryLng: Number(lng.toFixed(6)),
        distanceFromLaundryKm: Number(distanceFromLaundryKm.toFixed(2)),
        extraFee: calculateTieredDeliveryFee(distanceFromLaundryKm),
      }));
      setMapError("");
    } catch {
      setMapError("Gagal sinkronkan alamat pengantaran ke map. Silakan coba lagi.");
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
  const isPickupOrder = form.orderType === "pickup";
  const canSubmitOrder = Boolean(
    selectedService
    && (
      isPickupOrder
        ? (form.isServiceAreaValid && form.pickupAddress && typeof form.pickupLat === "number" && typeof form.pickupLng === "number")
        : (form.deliveryAddress && typeof form.deliveryLat === "number" && typeof form.deliveryLng === "number")
    )
  );
  const pickupPosition = useMemo(
    () => ({
      lat: typeof form.pickupLat === "number" ? form.pickupLat : DEFAULT_MAP_CENTER.lat,
      lng: typeof form.pickupLng === "number" ? form.pickupLng : DEFAULT_MAP_CENTER.lng,
    }),
    [form.pickupLat, form.pickupLng]
  );

  const deliveryPosition = useMemo(
    () => ({
      lat: typeof form.deliveryLat === "number" ? form.deliveryLat : DEFAULT_MAP_CENTER.lat,
      lng: typeof form.deliveryLng === "number" ? form.deliveryLng : DEFAULT_MAP_CENTER.lng,
    }),
    [form.deliveryLat, form.deliveryLng]
  );

  const normalizedWeight = useMemo(() => {
    const raw = String(form.weight ?? '').trim();
    if (!raw) return 0;

    const normalized = raw.replace(',', '.');
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  }, [form.weight]);

  const serviceUnitPrice = Number(selectedService?.pricePerKg || 0);
  const estimatedPrice = normalizedWeight > 0 && serviceUnitPrice > 0
    ? normalizedWeight * serviceUnitPrice
    : 0;
  const grandTotal = estimatedPrice + Number(form.extraFee || 0);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const persistSavedAddresses = (nextAddresses) => {
    setSavedAddresses(nextAddresses);
    localStorage.setItem(savedAddressStorageSlot, JSON.stringify(nextAddresses));
  };

  const isServiceAreaAllowed = (lat, lng, district = "") => {
    const normalizedDistrict = String(district || "").toLowerCase();
    const isInsideByDistrict = SERVICE_DISTRICTS.some((name) => normalizedDistrict.includes(name));
    const isInsideBySubdistrict = KNOWN_SUBDISTRICTS.some((name) => normalizedDistrict.includes(name));
    const isInsideByPolygon = serviceAreaPolygons.length > 0
      ? isPointInAnyPolygon({ lat, lng }, serviceAreaPolygons)
      : false;

    // Use polygon check if available, otherwise fallback to district or subdistrict matching
    return serviceAreaPolygons.length > 0 
      ? isInsideByPolygon 
      : (isInsideByDistrict || isInsideBySubdistrict);
  };

  const applySavedAddress = (addressEntry) => {
    if (!addressEntry) return;

    const lat = Number(addressEntry.lat ?? 0);
    const lng = Number(addressEntry.lng ?? 0);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setMapError("Koordinat alamat tersimpan tidak valid.");
      return;
    }

    // Get order type from addressEntry (which was set by SavedAddresses page)
    const orderType = addressEntry.orderType || 'pickup';

    // Set address based on order type from saved context
    setForm((prev) => {
      if (orderType === "pickup") {
        // For pickup: set pickup address and coordinates
        return {
          ...prev,
          pickupAddress: addressEntry.address || "",
          pickupLat: lat,
          pickupLng: lng,
        };
      } else {
        // For drop_off: set delivery address and coordinates
        return {
          ...prev,
          deliveryAddress: addressEntry.address || "",
          deliveryLat: lat,
          deliveryLng: lng,
        };
      }
    });

    // Only trigger validation for pickup orders
    if (orderType === "pickup") {
      setTimeout(() => {
        updatePickupFromCoordinates(lat, lng);
      }, 0);
    }
    
    // Clean up context
    sessionStorage.removeItem('order_type_context');
  };

  const openSavedAddressesPage = () => {
    // Save entire form state before navigating to addresses page
    sessionStorage.setItem('order_form_state', JSON.stringify(form));
    sessionStorage.setItem('order_type_context', form.orderType);
    navigate('/customer/addresses');
  };

  useEffect(() => {
    if (form.orderType !== "pickup") return;

    setForm((prev) => {
      if (prev.deliveryAddress === prev.pickupAddress && prev.deliveryLat === prev.pickupLat && prev.deliveryLng === prev.pickupLng) {
        return prev;
      }

      return {
        ...prev,
        deliveryAddress: prev.pickupAddress,
        deliveryLat: prev.pickupLat,
        deliveryLng: prev.pickupLng,
      };
    });
  }, [form.pickupAddress]);

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

  const setOrderType = (type) => {
    if (type === form.orderType) return;

    setForm((prev) => {
      if (type === "drop_off") {
        pickupBackupRef.current = {
          pickupAddress: prev.pickupAddress,
          pickupDistrict: prev.pickupDistrict,
          pickupLat: prev.pickupLat,
          pickupLng: prev.pickupLng,
          isServiceAreaValid: prev.isServiceAreaValid,
          distanceFromLaundryKm: prev.distanceFromLaundryKm,
          extraFee: prev.extraFee,
          deliveryAddress: prev.deliveryAddress,
          deliveryLat: prev.deliveryLat,
          deliveryLng: prev.deliveryLng,
        };

        return {
          ...prev,
          orderType: "drop_off",
          pickupAddress: OUTLET_ADDRESS,
          pickupLat: OUTLET_COORDINATE.lat,
          pickupLng: OUTLET_COORDINATE.lng,
          pickupDistrict: "",
          isServiceAreaValid: true,
          distanceFromLaundryKm: 0,
          extraFee: 0,
          deliveryAddress: prev.deliveryAddress || prev.pickupAddress || "",
          deliveryLat: prev.deliveryLat,
          deliveryLng: prev.deliveryLng,
        };
      }

      const backup = pickupBackupRef.current;

      return {
        ...prev,
        orderType: "pickup",
        pickupAddress: backup?.pickupAddress || prev.pickupAddress,
        pickupDistrict: backup?.pickupDistrict || prev.pickupDistrict,
        isServiceAreaValid: typeof backup?.isServiceAreaValid === "boolean" ? backup.isServiceAreaValid : prev.isServiceAreaValid,
        pickupLat: backup?.pickupLat ?? prev.pickupLat,
        pickupLng: backup?.pickupLng ?? prev.pickupLng,
        distanceFromLaundryKm: backup?.distanceFromLaundryKm ?? prev.distanceFromLaundryKm,
        extraFee: backup?.extraFee ?? prev.extraFee,
        deliveryAddress: backup?.deliveryAddress || backup?.pickupAddress || prev.pickupAddress,
        deliveryLat: backup?.deliveryLat ?? backup?.pickupLat ?? prev.pickupLat,
        deliveryLng: backup?.deliveryLng ?? backup?.pickupLng ?? prev.pickupLng,
      };
    });

    if (type === "drop_off") {
      setMapError("");
    }
  };

  const submitOrder = async () => {
    if (!selectedService) return;

    setSubmitting(true);
    setMapError("");

    try {
      const payload = {
        service_id: Number(selectedService.id),
        order_type: form.orderType,
        pickup_address: form.pickupAddress,
        pickup_lat: form.pickupLat,
        pickup_lng: form.pickupLng,
        pickup_date: form.pickupDate,
        pickup_time: form.pickupTime,
        delivery_address: form.orderType === "drop_off" ? form.deliveryAddress : (form.deliveryAddress || form.pickupAddress),
        delivery_lat: form.orderType === "drop_off" ? form.deliveryLat : form.pickupLat,
        delivery_lng: form.orderType === "drop_off" ? form.deliveryLng : form.pickupLng,
        estimated_weight: normalizedWeight,
        payment_method: String(form.paymentMethod || "").toLowerCase(),
        notes: form.notes || null,
      };

      const response = await api.post("/orders", payload);
      const created = response?.data?.data;

      if (!created) {
        throw new Error("Response order tidak valid");
      }

      const uiOrder = {
        id: created.order_number || `ORD-${created.id}`,
        rawId: created.id,
        order_number: created.order_number || `ORD-${created.id}`,
        service: created?.service?.name || selectedService.label,
          status: "Menunggu Konfirmasi",
          backend_status: "waiting_confirmation",
        payment_status: "unpaid",
        paymentMethod: String(created.payment_method || form.paymentMethod || "").toUpperCase(),
        verified: false,
        estimated_price: estimatedPrice,
        actual_weight: null,
        weight: normalizedWeight,
        clothesCount: form.clothesCount,
        pickupAddress: created.pickup_address || form.pickupAddress,
        deliveryAddress: created.delivery_address || (form.orderType === "drop_off" ? form.deliveryAddress : form.pickupAddress),
        pickupDate: form.pickupDate,
        pickupTime: form.pickupTime,
        notes: form.notes,
        items: form.items,
        extraFee: Number(form.extraFee || 0),
        laundryPrice: estimatedPrice,
        distanceFromLaundryKm: Number(form.distanceFromLaundryKm || 0),
        price: grandTotal,
        date: new Date(created.created_at || Date.now()).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };

      setPlacedOrder(uiOrder);
      setShowReceipt(true);
    } catch (err) {
      const message = err?.response?.data?.message || "Gagal membuat pesanan ke server";
      setMapError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) {
      setPhoneError('Nomor telepon tidak boleh kosong');
      return;
    }
    if (phoneInput.trim().length < 10) {
      setPhoneError('Nomor telepon minimal 10 digit');
      return;
    }
    setPhoneSaving(true);
    setPhoneError('');
    try {
      const response = await api.patch('/auth/me', { phone: phoneInput.trim() });
      const updatedUser = response?.data?.data;
      if (updatedUser) {
        updateCurrentUser?.(updatedUser);
        setShowPhoneModal(false);
      }
    } catch (err) {
      setPhoneError(err?.response?.data?.message || 'Gagal menyimpan nomor telepon');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if user has phone number
    if (!currentUser?.phone) {
      setShowPhoneModal(true);
      return;
    }

    if (!selectedService) {
      setServicesError("Layanan belum tersedia. Silakan coba refresh halaman.");
      return;
    }
    if (isPickupOrder && !form.isServiceAreaValid) {
      setMapError("Order hanya tersedia untuk area kecamatan Tembalang dan Banyumanik.");
      return;
    }

    if (isPickupOrder && (typeof form.pickupLat !== "number" || typeof form.pickupLng !== "number")) {
      setMapError("Silakan pilih titik penjemputan di map terlebih dahulu.");
      return;
    }

    setShowVerifyModal(true);
  };

  const handleVerifyAndSubmit = async () => {
    setShowVerifyModal(false);
    await submitOrder();
  };

  const handleNewOrder = () => {
    setShowReceipt(false);
    setPlacedOrder(null);
    setForm(createBlankForm());
  };

  return (
    <Layout>
      <div className="order-page">
        <PageTitle
          title="Place an Order"
          subtitle="Fill in the details and we'll take care of the rest."
        />

        <form className="order-form" onSubmit={handleSubmit}>

          {/* 1. Jenis Order */}
          <div className="order-section">
            <h3 className="section-title"><IconBag /> Jenis Order</h3>
            <div className="payment-grid">
              {ORDER_TYPES.map(({ id, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  className={`payment-option ${form.orderType === id ? "selected" : ""}`}
                  onClick={() => setOrderType(id)}
                >
                  <div className="payment-text">
                    <span className="payment-label">{label}</span>
                    <span className="payment-desc">{desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pilih Layanan */}
          <div className="order-section">
            <h3 className="section-title"><IconBag /> Select Service</h3>
            {servicesError && <span className="form-hint">{servicesError}</span>}
            <div className="service-grid">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`service-card ${String(form.service) === String(s.id) ? "active" : ""}`}
                  onClick={() => set("service", String(s.id))}
                >
                  <p className="service-card-name">{s.label}</p>
                  <p className="service-card-desc">{s.desc}</p>
                  <p className="service-card-price">Rp {s.pricePerKg.toLocaleString("id-ID")}/{s.unit}</p>
                  <p className="service-card-dur">{s.duration}</p>
                </button>
              ))}
            </div>
          </div>

          {isPickupOrder ? (
            <>
              {/* 3. Jadwal Penjemputan */}
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

              {/* 4. Alamat */}
              <div className="order-section">
                <div className="section-header-with-action">
                  <h3 className="section-title"><IconMapPin /> Alamat</h3>
                  <button
                    type="button"
                    className="btn-pick-saved-address"
                    onClick={openSavedAddressesPage}
                  >
                    Pilih Alamat Tersimpan
                  </button>
                </div>
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
                    {form.pickupLat && form.pickupLng && (
                      <Marker
                        icon={deliveryMarkerIcon}
                        position={[form.pickupLat, form.pickupLng]}
                      />
                    )}
                    <MapClickHandler onSelect={updatePickupFromCoordinates} />
                  </MapContainer>
                </div>
                <p className="map-coord-hint">
                  Koordinat: {form.pickupLat ?? "-"}, {form.pickupLng ?? "-"}
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
                    Area valid untuk pemesanan.
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
                </div>
              </div>
            </>
          ) : (
            <div className="order-section">
              <div className="section-header-with-action">
                <h3 className="section-title"><IconMapPin /> Drop Off ke Outlet</h3>
                <button
                  type="button"
                  className="btn-pick-saved-address"
                  onClick={openSavedAddressesPage}
                >
                  Pilih Alamat Tersimpan
                </button>
              </div>
              <div className="map-area-warning" style={{ marginBottom: 14 }}>
                Anda memilih Drop Off. Silakan antar pakaian kotor langsung ke outlet, lalu isi alamat pengantaran untuk pengiriman setelah selesai dicuci.
              </div>
              {mapError && <div className="map-error-box">{mapError}</div>}
              {loadingServiceArea && (
                <p className="form-hint" style={{ marginBottom: 8 }}>
                  Memuat boundary kecamatan resmi...
                </p>
              )}
              <div className="map-picker-wrap">
                <MapContainer
                  center={[deliveryPosition.lat, deliveryPosition.lng]}
                  zoom={14}
                  className="map-canvas"
                  scrollWheelZoom
                >
                  <MapCenterUpdater lat={deliveryPosition.lat} lng={deliveryPosition.lng} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    icon={deliveryMarkerIcon}
                    position={[deliveryPosition.lat, deliveryPosition.lng]}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const { lat, lng } = event.target.getLatLng();
                        updateDeliveryFromCoordinates(lat, lng);
                      },
                    }}
                  />
                  <MapClickHandler onSelect={updateDeliveryFromCoordinates} />
                </MapContainer>
              </div>
              <p className="map-coord-hint">
                Koordinat: {form.deliveryLat ?? "-"}, {form.deliveryLng ?? "-"}
              </p>
              {form.deliveryAddress && (
                <p className="map-area-hint">
                  Alamat pengantaran terdeteksi: {form.deliveryAddress}
                </p>
              )}
              {form.deliveryAddress && (
                <p className="map-area-hint">
                  Jarak dari Laundry: {Number(form.distanceFromLaundryKm || 0).toFixed(2)} km
                </p>
              )}
              <div className="address-fields">
                <div className="form-field">
                  <label className="form-label">Alamat Pengantaran</label>
                  <textarea
                    required
                    rows={2}
                    value={form.deliveryAddress}
                    onChange={e => set("deliveryAddress", e.target.value)}
                    onBlur={geocodeManualDeliveryAddress}
                    placeholder="Masukkan alamat pengantaran setelah cucian selesai..."
                    className="form-textarea"
                  />
                  <span className="form-hint">
                    Alamat ini dipakai untuk mengirim hasil cucian kembali ke rumah atau lokasi tujuan Anda.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Detail Cucian */}
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

          {/* 6. Metode Pembayaran */}
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

          {/* 7. Ringkasan */}
          <div className="summary-card">
            <h3 className="summary-title">📋 Ringkasan Pesanan</h3>
            <div className="summary-rows">
              {[
                { label: "Jenis Order",    value: form.orderType === "pickup" ? "Pickup" : "Drop Off" },
                { label: "Layanan",        value: selectedService?.label || "-" },
                { label: "Jadwal",         value: form.orderType === "pickup" ? (form.pickupTime ? `${formatDateLabel(form.pickupDate)} · ${form.pickupTime}` : "-") : "Drop off ke outlet" },
                { label: "Berat",          value: form.weight ? `${form.weight} kg` : "-" },
                { label: "Jumlah Pakaian", value: form.clothesCount ? `${form.clothesCount} pcs` : "-" },
                { label: "Alamat Antar",    value: form.orderType === "pickup" ? (form.pickupAddress || "-") : OUTLET_ADDRESS },
                { label: "Alamat Kembali",  value: form.orderType === "pickup" ? (form.deliveryAddress || form.pickupAddress || "-") : (form.deliveryAddress || "-") },
                { label: "Pembayaran",     value: form.paymentMethod },
                { label: "Catatan",        value: form.notes || "-" },
              ].map(({ label, value }) => (
                <div key={label} className="summary-row">
                  <span className="summary-row-label">{label}</span>
                  <span className="summary-row-value">{value}</span>
                </div>
              ))}
              <hr className="summary-divider" />
              <div className="summary-total-row">
                <span className="summary-total-label">Harga Layanan</span>
                <span className="summary-total-price">
                  {serviceUnitPrice > 0 ? `${formatRp(serviceUnitPrice)}/kg` : '-'}
                </span>
              </div>
              <div className="summary-total-row">
                <span className="summary-total-label">Estimasi Harga</span>
                <span className="summary-total-price">
                  {estimatedPrice > 0 ? formatRp(estimatedPrice) : "-"}
                </span>
              </div>
              {form.extraFee > 0 && (
                <div className="summary-total-row summary-total-row-extra">
                  <span className="summary-total-label">{form.orderType === "pickup" ? "Biaya Antar Jemput" : "Biaya Pengantaran"}</span>
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
                  {normalizedWeight} kg × Rp {serviceUnitPrice.toLocaleString("id-ID")}/kg
                </p>
              )}
              <p className="summary-note">
                * Harga final ditentukan setelah employee memverifikasi berat aktual
              </p>
            </div>
          </div>

          <button type="submit" className="btn-confirm" disabled={!canSubmitOrder || submitting}>
            {submitting ? "Menyimpan Pesanan..." : "Confirm Order"}
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

        {showVerifyModal && (
          <div className="verify-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="verify-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="verify-title">Verifikasi Pesanan</h3>
              <p className="verify-subtitle">Pastikan data order sudah sesuai sebelum dibuat.</p>

              <div className="verify-list">
                <div className="verify-row">
                  <span>Jenis Order</span>
                  <strong>{form.orderType === "pickup" ? "Pickup" : "Drop Off"}</strong>
                </div>
                <div className="verify-row">
                  <span>Layanan</span>
                  <strong>{selectedService?.label || "-"}</strong>
                </div>
                <div className="verify-row">
                  <span>{form.orderType === "pickup" ? "Jadwal Jemput" : "Jadwal"}</span>
                  <strong>{form.orderType === "pickup" ? `${formatDateLabel(form.pickupDate)} · ${form.pickupTime}` : "Drop off ke outlet"}</strong>
                </div>
                <div className="verify-row">
                  <span>Berat Estimasi</span>
                  <strong>{form.weight ? `${form.weight} kg` : "-"}</strong>
                </div>
                <div className="verify-row">
                  <span>{form.orderType === "pickup" ? "Alamat Jemput" : "Alamat Outlet"}</span>
                  <strong className="verify-address">{form.orderType === "pickup" ? (form.pickupAddress || "-") : OUTLET_ADDRESS}</strong>
                </div>
                <div className="verify-row">
                  <span>{form.orderType === "pickup" ? "Alamat Pengantaran" : "Alamat Kembali"}</span>
                  <strong className="verify-address">{form.orderType === "pickup" ? (form.deliveryAddress || form.pickupAddress || "-") : (form.deliveryAddress || "-")}</strong>
                </div>
                <div className="verify-row">
                  <span>Pembayaran</span>
                  <strong>{form.paymentMethod}</strong>
                </div>
                <div className="verify-row verify-total-row">
                  <span>Total</span>
                  <strong>{grandTotal > 0 ? formatRp(grandTotal) : "-"}</strong>
                </div>
              </div>

              <div className="verify-actions">
                <button type="button" className="verify-btn verify-btn-cancel" onClick={() => setShowVerifyModal(false)}>
                  Cek Lagi
                </button>
                <button type="button" className="verify-btn verify-btn-confirm" onClick={handleVerifyAndSubmit}>
                  Ya, Buat Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Completion Modal */}
        {showPhoneModal && createPortal(
          <div className="order-phone-overlay">
            <div className="order-phone-modal">
              <div className="order-phone-header">
                <Phone size={24} color="#0ea5e9" />
                <h3>Lengkapi Nomor Telepon</h3>
                <p>Kami membutuhkan nomor telepon Anda sebelum membuat pesanan</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleSavePhone(); }}>
                <div className="order-phone-field">
                  <label>Nomor Telepon/WhatsApp *</label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    disabled={phoneSaving}
                  />
                  {phoneError && <span className="order-phone-error">{phoneError}</span>}
                </div>
                <div className="order-phone-actions">
                  <button type="submit" disabled={phoneSaving} className="order-phone-btn">
                    {phoneSaving ? 'Menyimpan...' : 'Simpan & Lanjut Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      </div>
    </Layout>
  );
}