import api from './api';

const mlService = {
  /** Prediksi revenue untuk N hari ke depan */
  getRevenuePrediction: (days = 30, historyDays = 90) =>
    api.get('/admin/ml/predict/revenue', { params: { days, history_days: historyDays } }),

  /** Prediksi demand order per service */
  getDemandForecast: (days = 7, historyDays = 30, serviceId = null) =>
    api.get('/admin/ml/predict/demand', {
      params: { days, history_days: historyDays, ...(serviceId && { service_id: serviceId }) },
    }),

  /** Churn risk semua customer (atau satu jika ada customerId) */
  getChurnPrediction: (customerId = null) =>
    api.get('/admin/ml/predict/churn', {
      params: customerId ? { customer_id: customerId } : {},
    }),

  /** Rekomendasi bisnis berbasis data N hari terakhir */
  getRecommendations: (period = 30) =>
    api.get('/admin/ml/recommendations', { params: { period } }),

  /** Status model ML yang sudah di-train */
  getModelsStatus: () =>
    api.get('/admin/ml/models/status'),
};

export default mlService;
