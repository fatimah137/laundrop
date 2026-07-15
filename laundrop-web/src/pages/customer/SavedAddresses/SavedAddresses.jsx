import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Plus, Trash2, MapPin, Check, X, ArrowLeft } from 'lucide-react';
import { useRole } from '../../../context/RoleContext';
import Layout from '../../../components/Customer/Layout';
import PageTitle from '../../../components/ui/PageTitle';
import Toast from '../../../components/shared/Toast';
import 'leaflet/dist/leaflet.css';
import './SavedAddresses.css';

const SAVED_ADDRESS_STORAGE_KEY = 'laundrop_saved_addresses_v1';
const MAX_SAVED_ADDRESSES = 8;
const LAUNDRY_COORDINATE = { lat: -7.0715116551644055, lng: 110.41728959200246 };
const DEFAULT_MAP_CENTER = LAUNDRY_COORDINATE;

const mapMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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

export default function SavedAddresses() {
  const navigate = useNavigate();
  const { role, userData } = useRole();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formLat, setFormLat] = useState(DEFAULT_MAP_CENTER.lat);
  const [formLng, setFormLng] = useState(DEFAULT_MAP_CENTER.lng);
  const [toast, setToast] = useState(null);

  const userKey = useMemo(() => {
    return `${role}:${userData?.id || 'unknown'}`;
  }, [role, userData?.id]);

  const savedAddressStorageSlot = useMemo(() => {
    return `${SAVED_ADDRESS_STORAGE_KEY}:${userKey}`;
  }, [userKey]);

  // Load saved addresses dari localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedAddressStorageSlot);
      const parsed = JSON.parse(raw || '[]');
      setSavedAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setSavedAddresses([]);
    }
  }, [savedAddressStorageSlot]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const persistAddresses = (nextAddresses) => {
    setSavedAddresses(nextAddresses);
    localStorage.setItem(savedAddressStorageSlot, JSON.stringify(nextAddresses));
  };

  const handleSelectMap = (lat, lng) => {
    setFormLat(lat);
    setFormLng(lng);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      showToast('Nama alamat harus diisi (contoh: Rumah, Kantor)', 'danger');
      return;
    }
    if (!formAddress.trim()) {
      showToast('Deskripsi alamat harus diisi', 'danger');
      return;
    }

    if (editingId) {
      // Edit existing
      const updated = savedAddresses.map((addr) =>
        addr.id === editingId
          ? {
              ...addr,
              name: formName.trim(),
              address: formAddress.trim(),
              lat: formLat,
              lng: formLng,
            }
          : addr
      );
      persistAddresses(updated);
      showToast('Alamat berhasil diperbarui');
    } else {
      // Add new
      const newAddr = {
        id: Date.now(),
        name: formName.trim(),
        address: formAddress.trim(),
        lat: formLat,
        lng: formLng,
      };
      const nextAddresses = [newAddr, ...savedAddresses].slice(0, MAX_SAVED_ADDRESSES);
      persistAddresses(nextAddresses);
      showToast('Alamat berhasil disimpan');
    }

    resetForm();
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setFormName(addr.name);
    setFormAddress(addr.address);
    setFormLat(addr.lat);
    setFormLng(addr.lng);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const updated = savedAddresses.filter((addr) => addr.id !== id);
    persistAddresses(updated);
    showToast('Alamat berhasil dihapus', 'success');
  };

  const handleUseAddress = (addr) => {
    // Simpan pilihan ke sessionStorage dan kembali ke order page
    sessionStorage.setItem('selected_saved_address', JSON.stringify(addr));
    navigate('/customer/order', { replace: true });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormAddress('');
    setFormLat(DEFAULT_MAP_CENTER.lat);
    setFormLng(DEFAULT_MAP_CENTER.lng);
  };

  return (
    <Layout>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="sa-page">
        {/* Header */}
        <div className="sa-header">
          <div className="sa-header-left">
            <button className="sa-btn-back" onClick={() => navigate('/customer/order')}>
              <ArrowLeft size={20} />
            </button>
            <PageTitle title="Alamat Tersimpan" />
          </div>
          {!showForm && (
            <button className="sa-btn-add" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Tambah Alamat
            </button>
          )}
        </div>

        {/* Form Add/Edit */}
        {showForm && (
          <div className="sa-form-card">
            <h3 className="sa-form-title">{editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>

            <label className="sa-label">
              Nama Alamat (contoh: Rumah, Kantor, Orang Tua)
              <input
                type="text"
                className="sa-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Rumah"
              />
            </label>

            <label className="sa-label">
              Deskripsi Alamat
              <textarea
                className="sa-textarea"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Jl. Merpati No. 123, Semarang"
                rows={2}
              />
            </label>

            <label className="sa-label">
              Pilih Titik di Map
              <div className="sa-map-container">
                <MapContainer
                  center={[formLat, formLng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="sa-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onSelect={handleSelectMap} />
                  <MapCenterUpdater lat={formLat} lng={formLng} />
                  {formLat && formLng && (
                    <Marker position={[formLat, formLng]} icon={mapMarkerIcon} />
                  )}
                </MapContainer>
                <p className="sa-map-hint">Klik map untuk memilih titik lokasi</p>
              </div>
            </label>

            <p className="sa-coord-display">
              Koordinat: {formLat.toFixed(6)}, {formLng.toFixed(6)}
            </p>

            <div className="sa-form-actions">
              <button className="sa-btn-cancel" onClick={resetForm}>
                <X size={14} /> Batal
              </button>
              <button className="sa-btn-save" onClick={handleSave}>
                <Check size={14} /> {editingId ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </div>
        )}

        {/* List Alamat Tersimpan */}
        <div className="sa-list">
          {savedAddresses.length === 0 ? (
            <div className="sa-empty">
              <MapPin size={40} />
              <p>Belum ada alamat tersimpan</p>
              <button className="sa-btn-add" onClick={() => setShowForm(true)}>
                <Plus size={14} /> Tambah Alamat Pertama
              </button>
            </div>
          ) : (
            savedAddresses.map((addr) => (
              <div key={addr.id} className="sa-card">
                <div className="sa-card-header">
                  <div>
                    <h4 className="sa-card-name">{addr.name}</h4>
                    <p className="sa-card-address">{addr.address}</p>
                    <p className="sa-card-coord">
                      {addr.lat.toFixed(6)}, {addr.lng.toFixed(6)}
                    </p>
                  </div>
                </div>

                <div className="sa-card-actions">
                  <button
                    className="sa-btn-use"
                    onClick={() => handleUseAddress(addr)}
                  >
                    Gunakan
                  </button>
                  <button
                    className="sa-btn-edit"
                    onClick={() => handleEdit(addr)}
                  >
                    Edit
                  </button>
                  <button
                    className="sa-btn-delete"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
