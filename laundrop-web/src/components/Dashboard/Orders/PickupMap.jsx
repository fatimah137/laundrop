import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Package, Navigation, CheckCircle } from 'lucide-react';
import { STATUS_CONFIG } from '../../../data/statusConfig';
import StatusBadge from '../../shared/StatusBadge';
import { formatIDR } from '../../../data/format';

import 'leaflet/dist/leaflet.css';
import './PickupMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getStatusColor = (status) => STATUS_CONFIG[status]?.color || '#6B7280';

function createColoredIcon(status, isSelected) {
  const color = getStatusColor(status);
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `
      <div class="pin-marker ${isSelected ? 'is-selected' : ''}" style="background-color: ${color}">
        <div class="pin-inner"></div>
      </div>
    `,
    iconSize:    [isSelected ? 40 : 32, isSelected ? 40 : 32],
    iconAnchor:  [isSelected ? 20 : 16, isSelected ? 40 : 32],
    popupAnchor: [0, -32],
  });
}

function FitBounds({ orders }) {
  const map = useMap();
  useEffect(() => {
    if (orders.length === 0) return;
    const bounds = L.latLngBounds(orders.map(o => [o._lat, o._lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [orders, map]);
  return null;
}

export default function PickupMap({ orders = [] }) {
  const [selectedId, setSelectedId] = useState(null);

  const ordersWithCoords = useMemo(() => {
    return orders.map(o => ({
      ...o,
      _lat: o.latitude  || -6.2088  + (Math.random() - 0.5) * 0.08,
      _lng: o.longitude || 106.8456 + (Math.random() - 0.5) * 0.08,
    }));
  }, [orders]);

  return (
    <div className="pickup-map-root">

      {/* Peta */}
      <div className="map-view-wrapper">
        <MapContainer center={[-6.2088, 106.8456]} zoom={12} className="leaflet-container-main">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds orders={ordersWithCoords} />
          {ordersWithCoords.map(order => (
            <Marker
              key={order.id}
              position={[order._lat, order._lng]}
              icon={createColoredIcon(order.status, selectedId === order.id)}
              eventHandlers={{ click: () => setSelectedId(order.id) }}
            >
              <Popup>
                <div className="map-popup-card">
                  <strong>{order.customer_name}</strong>
                  <p>{order.service_name}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="map-legend-box">
          <h4 className="legend-title">Status Pesanan</h4>
          {Object.keys(STATUS_CONFIG).slice(0, 5).map(key => (
            <div key={key} className="legend-row">
              <span className="legend-dot" style={{ background: STATUS_CONFIG[key].color }} />
              <span className="legend-text">{STATUS_CONFIG[key].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="map-sidebar-wrapper">
        <div className="sidebar-header-box">
          <h3 className="sidebar-title">{ordersWithCoords.length} Pesanan</h3>
          <p className="sidebar-subtitle">Pilih kartu untuk fokus di peta</p>
        </div>

        <div className="sidebar-content-scroll">
          {ordersWithCoords.map(order => (
            <div
              key={order.id}
              className={`order-card-map ${selectedId === order.id ? 'is-active' : ''}`}
              onClick={() => setSelectedId(order.id)}
            >
              <div className="card-header-flex">
                <span className="card-customer">{order.customer_name}</span>
                <StatusBadge status={order.status} />
              </div>

              <div className="card-info-stack">
                <div className="info-item">
                  <MapPin size={12} />
                  {order.customer_address || 'Alamat tidak tersedia'}
                </div>
                <div className="info-item">
                  <Package size={12} />
                  {order.service_name} · {order.quantity} {order.unit}
                </div>
              </div>

              {selectedId === order.id && (
                <div className="card-actions-row">
                  <button className="btn-map-action">
                    <Navigation size={14} /> Navigasi
                  </button>
                  <button className="btn-map-action primary">
                    <CheckCircle size={14} /> Selesai
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}