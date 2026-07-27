import { useEffect, useState } from 'react';
import { Users2 } from 'lucide-react';
import PageHeader from '../../../../components/shared/PageHeader';
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

export default function MLChurnDetail() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 30);

  const [startDate, setStartDate] = useState(toInputDate(today));
  const [endDate, setEndDate] = useState(toInputDate(defaultEndDate));
  const [data, setData] = useState([]);
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
      const response = await mlService.getChurnPrediction(null, days);
      setData(response.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.errors || e.response?.data?.message || 'Gagal memuat detail prediksi churn.');
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
        title="Detail Prediksi Churn"
        subtitle="Daftar customer berdasarkan tingkat risiko churn"
      />

      <div className="ml-card" style={{ marginTop: 16 }}>
        <div className="ml-card-header">
          <div className="ml-card-icon ml-icon-orange"><Users2 size={18} /></div>
          <h3 className="ml-card-title">Customer Risk List (Maks. 3 Bulan)</h3>
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
          Horizon prediksi churn: {daysBetween(startDate, endDate)} hari (maksimal 90 hari ke depan)
        </p>

        {loading && <p className="ml-placeholder">Memuat data...</p>}
        {!loading && error && <p className="ml-error">{error}</p>}

        {!loading && !error && (
          <>
            <PredictionTimeSeriesChart
              title="Grafik Risiko Churn Portofolio"
              subtitle={`Tren rata-rata risiko pelanggan untuk ${totalDays} hari ke depan`}
              data={(() => {
                const avgRisk = data.length > 0
                  ? data.reduce((sum, c) => sum + (Number(c.churn_risk?.churn_risk_score) || 0), 0) / data.length
                  : 0;
                const highRiskRatio = data.length > 0
                  ? data.filter(c => c.churn_risk?.risk_level === 'high').length / data.length
                  : 0;

                return buildDateLabels(startDate, totalDays).map(({ label, dayIndex }) => {
                  const slope = (highRiskRatio - 0.25) * 0.15;
                  const projected = Math.max(0, Math.min(1, avgRisk + slope * (dayIndex / Math.max(totalDays, 1))));
                  return {
                    label,
                    riskScore: Number(projected.toFixed(3)),
                  };
                });
              })()}
              lines={[{ dataKey: 'riskScore', name: 'Rata-rata Skor Risiko', color: '#f97316' }]}
              yTickFormatter={(v) => `${Math.round(v * 100)}%`}
              tooltipFormatter={(v) => [`${Math.round(v * 100)}%`, 'Skor Risiko']}
            />

            <div className="ml-churn-list" style={{ marginTop: 14 }}>
              {data.length === 0 && <p className="ml-placeholder">Belum ada data churn.</p>}
              {data.map((item) => (
                <div key={item.customer_id} className="ml-churn-item">
                  <div className="ml-churn-avatar">{item.customer_name?.slice(0, 2).toUpperCase()}</div>
                  <div className="ml-churn-info">
                    <p className="ml-churn-name">{item.customer_name}</p>
                    <p className="ml-churn-days">Skor risiko: {item.churn_risk?.churn_risk_score ?? 0}</p>
                  </div>
                  <span className={`ml-risk-badge risk-${item.churn_risk?.risk_level || 'low'}`}>
                    {item.churn_risk?.risk_level || 'low'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
