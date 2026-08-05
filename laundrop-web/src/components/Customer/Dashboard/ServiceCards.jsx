import { useEffect, useState } from 'react';
import { Shirt, Zap, Sparkles, Clock } from "lucide-react";
import api from '../../../services/api';
import "./ServiceCards.css";

const ICON_MAP = {
  'cuci': Shirt,
  'setrika': Zap,
  'kering': Sparkles,
  'express': Clock,
  'default': Shirt,
};

const COLOR_MAP = {
  'cuci': 'blue',
  'setrika': 'orange',
  'kering': 'purple',
  'express': 'green',
  'default': 'blue',
};

const DURATION_MAP = {
  'cuci': '2–3 hari',
  'setrika': '1–2 hari',
  'kering': '3–5 hari',
  'express': '24 jam',
  'default': '2–3 hari',
};

function getIconAndColor(name) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('express') || nameLower.includes('24')) {
    return { icon: ICON_MAP.express, color: COLOR_MAP.express, duration: DURATION_MAP.express };
  }
  if (nameLower.includes('kering')) {
    return { icon: ICON_MAP.kering, color: COLOR_MAP.kering, duration: DURATION_MAP.kering };
  }
  if (nameLower.includes('setrika') && !nameLower.includes('cuci')) {
    return { icon: ICON_MAP.setrika, color: COLOR_MAP.setrika, duration: DURATION_MAP.setrika };
  }
  if (nameLower.includes('cuci')) {
    return { icon: ICON_MAP.cuci, color: COLOR_MAP.cuci, duration: DURATION_MAP.cuci };
  }
  return { icon: ICON_MAP.default, color: COLOR_MAP.default, duration: DURATION_MAP.default };
}

function formatPrice(pricePerKg, unit) {
  if (!pricePerKg) return 'Rp -';
  const unitLabel = unit === 'pcs' ? ` / ${unit}` : ' / kg';
  return `Rp ${Number(pricePerKg).toLocaleString('id-ID')}${unitLabel}`;
}

export default function ServiceCards() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        const data = response?.data?.data || [];
        
        if (mounted) {
          setServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        if (mounted) {
          setServices([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchServices();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="services">
        <div className="services-grid">
          <div className="loading-placeholder">Loading services...</div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="services">
        <div className="services-grid">
          <div className="empty-state">No services available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="services">
      <div className="services-grid">
        {services.map((service) => {
          const { icon: Icon, color, duration } = getIconAndColor(service.name);
          return (
            <div key={service.id} className={`card ${color}`}>
              <div className="icon-box">
                <Icon size={20} />
              </div>
              <p className="name">{service.name}</p>
              <p className="desc">{service.description || '-'}</p>
              <div className="card-footer">
                <span className="price">
                  {formatPrice(service.price_per_kg || service.price_per_pcs, service.unit || 'kg')}
                </span>
                <span className="duration">
                  <Clock size={14} /> {duration}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}