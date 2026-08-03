import { useEffect, useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import PageHeader from '../../../../components/shared/PageHeader';
import { formatIDR } from '../../../../data/format';
import mlService from '../../../../services/mlService';
import PredictionTimeSeriesChart from '../../../../components/Dashboard/ML/PredictionTimeSeriesChart';
import { downloadMlPdfReport } from '../../../../utils/mlPdfReport';
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

export default function MLRevenueDetail() {
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
      const response = await mlService.getRevenuePrediction(days, 90);
      setData(response.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.errors || e.response?.data?.message || 'Gagal memuat detail prediksi revenue.');
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

  const trendLabel = data?.trend === 'up' ? 'Naik' : data?.trend === 'down' ? 'Turun' : 'Stabil';

  const projectionData = data
    ? buildDateLabels(startDate, totalDays).map(({ label, dayIndex }) => {
      const trendFactor = data.trend === 'up'
        ? 1 + ((dayIndex - 1) / Math.max(totalDays, 1)) * 0.12
        : data.trend === 'down'
          ? 1 - ((dayIndex - 1) / Math.max(totalDays, 1)) * 0.12
          : 1;

      return {
        label,
        revenue: Math.max(0, Math.round((data.predicted_daily_average || 0) * trendFactor)),
      };
    })
    : [];

  const handleDownloadPdf = () => {
    if (!data) return;
    const todayStr = new Date().toLocaleString('id-ID');

    downloadMlPdfReport({
      title: 'Laporan Prediksi Revenue',
      subtitle: 'Business AI Laundrop',
      period: `${startDate} s/d ${endDate}`,
      generatedAt: todayStr,
      summaryRows: [
        { label: 'Periode Prediksi', value: `${daysBetween(startDate, endDate)} hari` },
        { label: 'Prediksi Total Revenue', value: formatIDR(data.predicted_total) },
        { label: 'Rata-rata Harian', value: formatIDR(data.predicted_daily_average) },
        { label: 'Akurasi Model', value: `${Math.round((data.confidence || 0) * 100)}%` },
        { label: 'Tren', value: trendLabel },
      ],
      tableHead: ['Tanggal', 'Proyeksi Revenue / Hari'],
      tableBody: projectionData.map((row) => [row.label, formatIDR(row.revenue)]),
      notes: data.summary || 'Tidak ada ringkasan AI.',
      filename: `laporan-prediksi-revenue-${startDate}-${endDate}.pdf`,
    });
  };

  return (
    <div className="ml-dashboard">
      <PageHeader
        title="Detail Prediksi Revenue"
        subtitle="Rincian estimasi pendapatan berdasarkan histori transaksi"
      />

      <div className="ml-card" style={{ marginTop: 16 }}>
        <div className="ml-card-header">
          <div className="ml-card-icon ml-icon-green"><TrendingUp size={18} /></div>
          <h3 className="ml-card-title">Prediksi Revenue (Maks. 3 Bulan)</h3>
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

        <div className="ml-range-actions">
          <p className="ml-range-caption">
            Periode prediksi: {daysBetween(startDate, endDate)} hari (maksimal 90 hari ke depan)
          </p>
          <button
            className="ml-export-btn"
            type="button"
            onClick={handleDownloadPdf}
            disabled={loading || !!error || !data}
          >
            <Download size={14} /> Unduh PDF
          </button>
        </div>

        {loading && <p className="ml-placeholder">Memuat data...</p>}
        {!loading && error && <p className="ml-error">{error}</p>}

        {!loading && !error && data && (
          <div>
            <p className="ml-revenue-label">Prediksi Total</p>
            <p className="ml-revenue-value">{formatIDR(data.predicted_total)}</p>
            <p className="ml-demand-range">
              Rata-rata harian: {formatIDR(data.predicted_daily_average)}
              <span className="ml-confidence"> · Akurasi {Math.round((data.confidence || 0) * 100)}%</span>
            </p>
            <p className="ml-demand-range" style={{ marginTop: 10 }}>
              Tren: <strong>{data.trend === 'up' ? 'Naik' : data.trend === 'down' ? 'Turun' : 'Stabil'}</strong>
            </p>

            <PredictionTimeSeriesChart
              title="Grafik Prediksi Revenue Harian"
              subtitle={`Simulasi per hari untuk ${totalDays} hari ke depan`}
              data={projectionData}
              lines={[{ dataKey: 'revenue', name: 'Revenue / Hari', color: '#16a34a' }]}
              yTickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${Math.round(v / 1000)}k`}
              tooltipFormatter={(v) => [formatIDR(v), 'Revenue']}
            />

            {/* Gemini AI Summary */}
            {data.summary && (
              <div className="ml-summary-box">
                <div className="ml-summary-header">
                  <span className="ml-summary-icon">✨</span>
                  <span className="ml-summary-label">Kesimpulan AI</span>
                </div>
                <p className="ml-summary-text">{data.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
