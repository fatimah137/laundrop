import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import PageHeader from '../../../../components/shared/PageHeader';
import { formatIDR } from '../../../../data/format';
import mlService from '../../../../services/mlService';
import PredictionTimeSeriesChart from '../../../../components/Dashboard/ML/PredictionTimeSeriesChart';
import '../MLDashboard.css';

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end - start) / 86400000) + 1;
  return Math.max(1, diff);
}

function buildDateLabels(startDate, totalDays) {
  const start = new Date(`${startDate}T00:00:00`);
  return Array.from({ length: totalDays }).map((_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    return { label, dayIndex: idx + 1 };
  });
}

export default function MLRecommendationDetail() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 30);

  const [startDate, setStartDate] = useState(toInputDate(today));
  const [endDate, setEndDate] = useState(toInputDate(defaultEndDate));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const minDateStr = toInputDate(today);
  const maxDateStr = toInputDate(maxDate);
  const totalDays = daysBetween(startDate, endDate);

  const load = async (fromDate, toDate) => {
    const days = daysBetween(fromDate, toDate);
    try {
      setLoading(true);
      setError('');
      const response = await mlService.getRecommendations(days);
      setData(response.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.errors || e.response?.data?.message || 'Gagal memuat detail rekomendasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(startDate, endDate);
  }, []);

  const handleApplyRange = () => {
    if (endDate < startDate) {
      setError('Tanggal akhir tidak boleh lebih kecil dari tanggal mulai.');
      return;
    }
    load(startDate, endDate);
  };

  const handleQuickRange = (days) => {
    const base = new Date();
    const start = toInputDate(base);
    const endObj = new Date(base);
    endObj.setDate(base.getDate() + (days - 1));
    const end = toInputDate(endObj);
    setStartDate(start);
    setEndDate(end);
    load(start, end);
  };

  return (
    <div className="ml-dashboard">
      <PageHeader
        title="Detail Rekomendasi Bisnis"
        subtitle="Insight keputusan bisnis berdasarkan metrik performa terbaru"
      />

      <div className="ml-card" style={{ marginTop: 16 }}>
        <div className="ml-card-header">
          <div className="ml-card-icon ml-icon-purple"><Lightbulb size={18} /></div>
          <h3 className="ml-card-title">Insight & Action Plan (Maks. 3 Bulan)</h3>
        </div>

        <div className="ml-range-controls">
          <div className="ml-range-field">
            <label>Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="ml-range-field">
            <label>Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={maxDateStr}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="ml-range-btn" type="button" onClick={handleApplyRange}>Terapkan</button>
        </div>

        <div className="ml-range-quick">
          <span className="ml-range-quick-label">Pilih Periode:</span>
          <button
            type="button"
            className={`ml-range-quick-btn ${totalDays === 7 ? 'active' : ''}`}
            onClick={() => handleQuickRange(7)}
          >
            7 hari
          </button>
          <button
            type="button"
            className={`ml-range-quick-btn ${totalDays === 30 ? 'active' : ''}`}
            onClick={() => handleQuickRange(30)}
          >
            30 hari
          </button>
          <button
            type="button"
            className={`ml-range-quick-btn ${totalDays === 90 ? 'active' : ''}`}
            onClick={() => handleQuickRange(90)}
          >
            90 hari
          </button>
        </div>

        <p className="ml-range-caption">
          Periode evaluasi insight: {daysBetween(startDate, endDate)} hari (maksimal 90 hari ke depan)
        </p>

        {loading && <p className="ml-placeholder">Memuat data...</p>}
        {!loading && error && <p className="ml-error">{error}</p>}

        {!loading && !error && data && (
          <div>
            <div className="ml-rec-summary" style={{ marginBottom: 14 }}>
              <div className="ml-rec-metric">
                <p className="ml-rec-metric-label">Revenue</p>
                <p className="ml-rec-metric-value">{formatIDR(data.summary?.total_revenue)}</p>
              </div>
              <div className="ml-rec-metric">
                <p className="ml-rec-metric-label">Order</p>
                <p className="ml-rec-metric-value">{data.summary?.order_count}</p>
              </div>
              <div className="ml-rec-metric">
                <p className="ml-rec-metric-label">Avg Order</p>
                <p className="ml-rec-metric-value">{formatIDR(data.summary?.avg_order_value)}</p>
              </div>
              <div className="ml-rec-metric">
                <p className="ml-rec-metric-label">Churn Rate</p>
                <p className="ml-rec-metric-value">{((data.summary?.churn_rate || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="ml-rec-list">
              {(data.recommendations || []).map((rec, i) => (
                <div key={i} className={`ml-rec-item priority-${rec.priority || 'low'}`}>
                  <div className="ml-rec-item-body">
                    <p className="ml-rec-message">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <PredictionTimeSeriesChart
              title="Grafik Proyeksi Revenue & Order"
              subtitle={`Visualisasi tren harian berdasarkan rekomendasi untuk ${totalDays} hari`}
              data={(() => {
                const summary = data.summary || {};
                const dailyRevenue = (summary.total_revenue || 0) / Math.max(totalDays, 1);
                const dailyOrder = (summary.order_count || 0) / Math.max(totalDays, 1);
                const hasUpsell = (data.recommendations || []).some(r => r.category === 'upsell');
                const hasRetention = (data.recommendations || []).some(r => r.category === 'retention');
                const growth = hasUpsell ? 0.12 : 0.06;
                const orderDrift = hasRetention ? 0.08 : 0.04;

                return buildDateLabels(startDate, totalDays).map(({ label, dayIndex }) => ({
                  label,
                  revenue: Math.max(0, Math.round(dailyRevenue * (1 + (dayIndex / Math.max(totalDays, 1)) * growth))),
                  orders: Math.max(0, Number((dailyOrder * (1 + (dayIndex / Math.max(totalDays, 1)) * orderDrift)).toFixed(2))),
                }));
              })()}
              lines={[
                { dataKey: 'revenue', name: 'Proyeksi Revenue/Hari', color: '#7c3aed', strokeWidth: 2.6 },
                { dataKey: 'orders', name: 'Proyeksi Order/Hari', color: '#14b8a6', dashArray: '5 5' },
              ]}
              yTickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${Math.round(v / 1000)}k`}
              tooltipFormatter={(v, name) => [name.includes('Revenue') ? formatIDR(v) : `${v} order`, name]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
