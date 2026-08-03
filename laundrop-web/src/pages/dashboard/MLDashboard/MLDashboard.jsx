import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Minus,
  Users, AlertTriangle, Lightbulb, RefreshCw, Brain
} from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import { formatIDR } from '../../../data/format';
import mlService from '../../../services/mlService';
import './MLDashboard.css';

/* ── Helpers ──────────────────────────────────────────────────── */
const PRIORITY_COLOR = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
const PRIORITY_LABEL = { high: 'Prioritas Tinggi', medium: 'Prioritas Sedang', low: 'Prioritas Rendah' };

const RISK_COLOR = { high: 'risk-high', medium: 'risk-medium', low: 'risk-low' };
const RISK_LABEL = { high: 'Risiko Tinggi', medium: 'Risiko Sedang', low: 'Risiko Rendah' };

function TrendIcon({ trend, size = 18 }) {
  if (trend === 'up')   return <TrendingUp  size={size} className="trend-up"   />;
  if (trend === 'down') return <TrendingDown size={size} className="trend-down" />;
  return <Minus size={size} className="trend-stable" />;
}

/* ── Sub-components ───────────────────────────────────────────── */
function SectionCard({ title, icon: Icon, iconTint = 'blue', loading, error, children }) {
  return (
    <div className="ml-card">
      <div className="ml-card-header">
        <div className={`ml-card-icon ml-icon-${iconTint}`}>
          <Icon size={18} />
        </div>
        <h3 className="ml-card-title">{title}</h3>
      </div>
      {loading && <p className="ml-placeholder">Memuat prediksi…</p>}
      {!loading && error && <p className="ml-error">{error}</p>}
      {!loading && !error && children}
    </div>
  );
}

function RevenueSection({ data }) {
  if (!data) return null;
  const { predicted_total, predicted_daily_average, trend, confidence, summary } = data;
  return (
    <div className="ml-revenue">
      <div className="ml-revenue-main">
        <p className="ml-revenue-label">Estimasi 30 Hari ke Depan</p>
        <p className="ml-revenue-value">{formatIDR(predicted_total)}</p>
        <div className="ml-revenue-meta">
          <TrendIcon trend={trend} />
          <span className="ml-trend-text">
            {trend === 'up' ? 'Tren Naik' : trend === 'down' ? 'Tren Turun' : 'Stabil'}
          </span>
          <span className="ml-confidence">· {Math.round(confidence * 100)}% akurasi</span>
        </div>
      </div>
      <div className="ml-revenue-daily">
        <p className="ml-daily-label">Rata-rata / hari</p>
        <p className="ml-daily-value">{formatIDR(predicted_daily_average)}</p>
      </div>
      {summary && (
        <div className="ml-summary-box ml-summary-compact">
          <div className="ml-summary-header">
            <span className="ml-summary-icon">✨</span>
            <span className="ml-summary-label">AI Insight</span>
          </div>
          <p className="ml-summary-text">{summary}</p>
        </div>
      )}
    </div>
  );
}

function DemandSection({ data }) {
  if (!data) return null;
  const { estimated_orders, range, confidence, summary } = data;
  return (
    <div className="ml-demand">
      <div className="ml-demand-main">
        <p className="ml-demand-label">Estimasi Order / Hari</p>
        <p className="ml-demand-value">{estimated_orders} order</p>
        <p className="ml-demand-range">
          Rentang: {range?.min} – {range?.max} order
          <span className="ml-confidence"> · {Math.round(confidence * 100)}% akurasi</span>
        </p>
      </div>
      {summary && (
        <div className="ml-summary-box ml-summary-compact">
          <div className="ml-summary-header">
            <span className="ml-summary-icon">✨</span>
            <span className="ml-summary-label">AI Insight</span>
          </div>
          <p className="ml-summary-text">{summary}</p>
        </div>
      )}
    </div>
  );
}

function ChurnSection({ data }) {
  if (!data || data.length === 0) {
    return <p className="ml-placeholder">Tidak ada data customer.</p>;
  }
  return (
    <div className="ml-churn-list">
      {data.slice(0, 5).map((item) => {
        const risk = item.churn_risk;
        return (
          <div key={item.customer_id} className="ml-churn-item">
            <div className="ml-churn-avatar">
              {item.customer_name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="ml-churn-info">
              <p className="ml-churn-name">{item.customer_name}</p>
              <p className="ml-churn-days">
                {risk?.days_since_last_order < 999
                  ? `${risk.days_since_last_order} hari sejak order terakhir`
                  : 'Belum pernah order'}
              </p>
            </div>
            <span className={`ml-risk-badge ${RISK_COLOR[risk?.risk_level]}`}>
              {RISK_LABEL[risk?.risk_level] ?? '-'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsSection({ data }) {
  if (!data) return null;
  const { summary, recommendations } = data;

  return (
    <div>
      {/* Summary metrics */}
      <div className="ml-rec-summary">
        <div className="ml-rec-metric">
          <p className="ml-rec-metric-label">Revenue (30 hari)</p>
          <p className="ml-rec-metric-value">{formatIDR(summary?.total_revenue)}</p>
        </div>
        <div className="ml-rec-metric">
          <p className="ml-rec-metric-label">Total Order</p>
          <p className="ml-rec-metric-value">{summary?.order_count}</p>
        </div>
        <div className="ml-rec-metric">
          <p className="ml-rec-metric-label">Avg. Order</p>
          <p className="ml-rec-metric-value">{formatIDR(summary?.avg_order_value)}</p>
        </div>
        <div className="ml-rec-metric">
          <p className="ml-rec-metric-label">Churn Rate</p>
          <p className={`ml-rec-metric-value ${summary?.churn_rate > 0.1 ? 'text-danger' : ''}`}>
            {(summary?.churn_rate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Recommendations list */}
      <div className="ml-rec-list">
        {recommendations?.map((rec, i) => (
          <div key={i} className={`ml-rec-item ${PRIORITY_COLOR[rec.priority]}`}>
            <div className="ml-rec-item-dot" />
            <div className="ml-rec-item-body">
              <span className={`ml-rec-badge ${PRIORITY_COLOR[rec.priority]}`}>
                {PRIORITY_LABEL[rec.priority]}
              </span>
              <p className="ml-rec-message">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function MLDashboard() {
  const [revenue,   setRevenue]   = useState(null);
  const [demand,    setDemand]    = useState(null);
  const [churn,     setChurn]     = useState(null);
  const [recs,      setRecs]      = useState(null);

  const [loadingRevenue,  setLoadingRevenue]  = useState(true);
  const [loadingDemand,   setLoadingDemand]   = useState(true);
  const [loadingChurn,    setLoadingChurn]    = useState(true);
  const [loadingRecs,     setLoadingRecs]     = useState(true);

  const [errorRevenue,  setErrorRevenue]  = useState(null);
  const [errorDemand,   setErrorDemand]   = useState(null);
  const [errorChurn,    setErrorChurn]    = useState(null);
  const [errorRecs,     setErrorRecs]     = useState(null);

  const fetchAll = useCallback(async () => {
    // Revenue
    setLoadingRevenue(true); setErrorRevenue(null);
    mlService.getRevenuePrediction()
      .then(r => setRevenue(r.data.data))
      .catch(e => setErrorRevenue(e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal memuat prediksi revenue.'))
      .finally(() => setLoadingRevenue(false));

    // Demand
    setLoadingDemand(true); setErrorDemand(null);
    mlService.getDemandForecast()
      .then(r => setDemand(r.data.data))
      .catch(e => setErrorDemand(e.response?.data?.errors ?? e.response?.data?.message ?? 'Gagal memuat prediksi demand.'))
      .finally(() => setLoadingDemand(false));

    // Churn
    setLoadingChurn(true); setErrorChurn(null);
    mlService.getChurnPrediction()
      .then((r) => {
        const payload = r.data.data;
        setChurn(Array.isArray(payload) ? payload : (payload?.items || []));
      })
      .catch(e => setErrorChurn(e.response?.data?.message ?? e.response?.data?.errors ?? 'Gagal memuat prediksi churn.'))
      .finally(() => setLoadingChurn(false));

    // Recommendations
    setLoadingRecs(true); setErrorRecs(null);
    mlService.getRecommendations()
      .then(r => setRecs(r.data.data))
      .catch(e => setErrorRecs(e.response?.data?.message ?? e.response?.data?.errors ?? 'Gagal memuat rekomendasi.'))
      .finally(() => setLoadingRecs(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="ml-dashboard">
      <div className="ml-dashboard-header">
        <PageHeader
          title="Business Intelligence"
          subtitle="Prediksi dan rekomendasi bisnis berbasis AI"
        />
        <button className="ml-refresh-btn" onClick={fetchAll} title="Refresh semua prediksi">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top row: Revenue + Demand */}
      <div className="ml-grid-top">
        <SectionCard
          title="Prediksi Revenue"
          icon={TrendingUp}
          iconTint="green"
          loading={loadingRevenue}
          error={errorRevenue}
        >
          <RevenueSection data={revenue} />
        </SectionCard>

        <SectionCard
          title="Prediksi Demand"
          icon={TrendingUp}
          iconTint="blue"
          loading={loadingDemand}
          error={errorDemand}
        >
          <DemandSection data={demand} />
        </SectionCard>
      </div>

      {/* Bottom row: Churn + Recommendations */}
      <div className="ml-grid-bottom">
        <SectionCard
          title="Risiko Churn Customer"
          icon={Users}
          iconTint="orange"
          loading={loadingChurn}
          error={errorChurn}
        >
          <ChurnSection data={churn} />
        </SectionCard>

        <SectionCard
          title="Rekomendasi Bisnis"
          icon={Lightbulb}
          iconTint="purple"
          loading={loadingRecs}
          error={errorRecs}
        >
          <RecommendationsSection data={recs} />
        </SectionCard>
      </div>

      <p className="ml-footer-note">
        <Brain size={13} />
        Prediksi dihasilkan oleh ML model berdasarkan data historis transaksi. Gunakan sebagai referensi pengambilan keputusan.
      </p>
    </div>
  );
}
