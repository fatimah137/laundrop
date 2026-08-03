import { useEffect, useState } from 'react';
import { Download, MessageCircle, Users2 } from 'lucide-react';
import PageHeader from '../../../../components/shared/PageHeader';
import mlService from '../../../../services/mlService';
import PredictionTimeSeriesChart from '../../../../components/Dashboard/ML/PredictionTimeSeriesChart';
import { downloadMlPdfReport } from '../../../../utils/mlPdfReport';
import '../MLDashboard.css';

const RISK_TOOLTIPS = {
  low: [
    'Tindakan untuk pelanggan low:',
    '',
    '1. jaga kualitas layanan tetap konsisten.',
    '2. kirim promo ringan/loyalty berkala.',
    '3. monitor perubahan skor, kalau naik ke medium baru intervensi lebih agresif.',
  ].join('\n'),
  medium: [
    'Tindakan untuk pelanggan medium:',
    '',
    '1. lakukan follow-up berkala lewat WhatsApp/pesan personal.',
    '2. berikan promo targeted agar tetap rutin order.',
    '3. pantau 7-14 hari, jika skor naik segera eskalasi ke intervensi high.',
  ].join('\n'),
  high: [
    'Tindakan untuk pelanggan high:',
    '',
    '1. lakukan kontak prioritas secepatnya (telepon/chat personal).',
    '2. tawarkan penawaran retensi yang lebih kuat dan relevan.',
    '3. catat alasan churn dan lakukan rencana pemulihan khusus pelanggan.',
  ].join('\n'),
};

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

function normalizeWhatsAppNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function buildPromoMessage(customerName) {
  const greetingName = customerName || 'Fatimah';
  return `Halo ${greetingName}

Sudah lama kami tidak melihat pesanan dari Anda. Semoga kabarnya selalu baik.

Sebagai ucapan terima kasih karena pernah menggunakan layanan Laundrop, kami memberikan diskon gratis ongkir untuk 1x transaksi laundry.

Promo berlaku hingga 10 Agustus 2026.

Pesan sekarang melalui website kami:
https://laundrop.vercel.app

Terima kasih, kami tunggu pesanan Anda kembali.

Salam hangat,
Tim Laundrop`;
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
  const [aiSummary, setAiSummary] = useState('');
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
      const payload = response.data?.data;

      if (Array.isArray(payload)) {
        setData(payload);
        setAiSummary('');
      } else {
        setData(payload?.items || []);
        setAiSummary(payload?.summary || '');
      }
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

  const riskChartData = (() => {
    const avgRisk = data.length > 0
      ? data.reduce((sum, c) => sum + (Number(c.churn_risk?.churn_risk_score) || 0), 0) / data.length
      : 0;
    const highRiskRatio = data.length > 0
      ? data.filter((c) => c.churn_risk?.risk_level === 'high').length / data.length
      : 0;

    return buildDateLabels(startDate, totalDays).map(({ label, dayIndex }) => {
      const slope = (highRiskRatio - 0.25) * 0.15;
      const projected = Math.max(0, Math.min(1, avgRisk + slope * (dayIndex / Math.max(totalDays, 1))));
      return {
        label,
        riskScore: Number(projected.toFixed(3)),
      };
    });
  })();

  const handleDownloadPdf = () => {
    const avgRisk = data.length > 0
      ? data.reduce((sum, c) => sum + (Number(c.churn_risk?.churn_risk_score) || 0), 0) / data.length
      : 0;
    const highRiskCount = data.filter((item) => item.churn_risk?.risk_level === 'high').length;
    const mediumRiskCount = data.filter((item) => item.churn_risk?.risk_level === 'medium').length;
    const lowRiskCount = data.filter((item) => item.churn_risk?.risk_level === 'low').length;

    downloadMlPdfReport({
      title: 'Laporan Prediksi Churn',
      subtitle: 'Business AI Laundrop',
      period: `${startDate} s/d ${endDate}`,
      generatedAt: new Date().toLocaleString('id-ID'),
      summaryRows: [
        { label: 'Horizon Prediksi', value: `${daysBetween(startDate, endDate)} hari` },
        { label: 'Total Customer Dianalisis', value: `${data.length}` },
        { label: 'Rata-rata Skor Risiko', value: `${avgRisk.toFixed(3)}` },
        { label: 'Risk High / Medium / Low', value: `${highRiskCount} / ${mediumRiskCount} / ${lowRiskCount}` },
      ],
      tableHead: ['Customer', 'Skor Risiko', 'Level Risiko'],
      tableBody: data.map((item) => [
        item.customer_name || '-',
        Number(item.churn_risk?.churn_risk_score || 0).toFixed(3),
        String(item.churn_risk?.risk_level || 'low').toUpperCase(),
      ]),
      notes: 'Gunakan daftar risiko untuk prioritas follow-up pelanggan yang berpotensi churn.',
      filename: `laporan-prediksi-churn-${startDate}-${endDate}.pdf`,
    });
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

        <div className="ml-range-actions">
          <p className="ml-range-caption">
            Horizon prediksi churn: {daysBetween(startDate, endDate)} hari (maksimal 90 hari ke depan)
          </p>
          <button
            className="ml-export-btn"
            type="button"
            onClick={handleDownloadPdf}
            disabled={loading || !!error}
          >
            <Download size={14} /> Unduh PDF
          </button>
        </div>

        {loading && <p className="ml-placeholder">Memuat data...</p>}
        {!loading && error && <p className="ml-error">{error}</p>}

        {!loading && !error && (
          <>
            <PredictionTimeSeriesChart
              title="Grafik Risiko Churn Portofolio"
              subtitle={`Tren rata-rata risiko pelanggan untuk ${totalDays} hari ke depan`}
              data={riskChartData}
              lines={[{ dataKey: 'riskScore', name: 'Rata-rata Skor Risiko', color: '#f97316' }]}
              yTickFormatter={(v) => `${Math.round(v * 100)}%`}
              tooltipFormatter={(v) => [`${Math.round(v * 100)}%`, 'Skor Risiko']}
            />

            {aiSummary && (
              <div className="ml-summary-box">
                <div className="ml-summary-header">
                  <span className="ml-summary-icon">✨</span>
                  <span className="ml-summary-label">Kesimpulan AI</span>
                </div>
                <p className="ml-summary-text">{aiSummary}</p>
              </div>
            )}

            <div className="ml-churn-list" style={{ marginTop: 14 }}>
              {data.length === 0 && <p className="ml-placeholder">Belum ada data churn.</p>}
              {data.map((item) => {
                const riskLevel = item.churn_risk?.risk_level || 'low';
                const tooltipText = RISK_TOOLTIPS[riskLevel] || null;
                const whatsappNumber = normalizeWhatsAppNumber(item.customer_phone);
                const promoMessage = buildPromoMessage(item.customer_name);
                const waLink = whatsappNumber
                  ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(promoMessage)}`
                  : '';

                return (
                  <div key={item.customer_id} className="ml-churn-item">
                    <div className="ml-churn-avatar">{item.customer_name?.slice(0, 2).toUpperCase()}</div>
                    <div className="ml-churn-info">
                      <p className="ml-churn-name">{item.customer_name}</p>
                      <p className="ml-churn-days">Skor risiko: {item.churn_risk?.churn_risk_score ?? 0}</p>
                    </div>
                    <div className="ml-churn-actions">
                      <span
                        className={`ml-risk-badge risk-${riskLevel} ${tooltipText ? 'ml-risk-tooltip-trigger' : ''}`}
                        data-tooltip={tooltipText || undefined}
                        tabIndex={tooltipText ? 0 : undefined}
                        aria-label={tooltipText || undefined}
                      >
                        {riskLevel}
                      </span>

                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-wa-promo-btn"
                          title="Kirim promo ringan via WhatsApp"
                        >
                          <MessageCircle size={13} /> Kirim Promo
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="ml-wa-promo-btn is-disabled"
                          disabled
                          title="Nomor WhatsApp customer belum tersedia"
                        >
                          <MessageCircle size={13} /> Kirim Promo
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
