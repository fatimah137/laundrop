"""
Controller untuk predictions - menggunakan model Machine Learning
(RandomForest) dari package ml_models, bukan lagi kalkulasi statistik manual.
"""
from flask import request, jsonify
import logging
from datetime import datetime
import numpy as np

from ml_models.revenue_model import RevenuePredictionModel, MIN_TRAINING_POINTS as MIN_REVENUE_POINTS
from ml_models.demand_model import DemandPredictionModel, MIN_TRAINING_POINTS as MIN_DEMAND_POINTS
from ml_models.churn_model import ChurnPredictionModel
from ml_models.data_generator import generate_churn_dataset

logger = logging.getLogger(__name__)


class PredictionController:
    """Controller untuk semua prediction endpoints"""

    @staticmethod
    def predict_revenue():
        """
        Prediksi revenue untuk periode mendatang, pakai RandomForestRegressor.

        Expected data:
        {
            "company_id": 1,
            "period_days": 30,
            "historical_data": [100000, 120000, 95000, ...]
        }
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({'error': 'No data provided'}), 400

            company_id = data.get('company_id')
            period_days = data.get('period_days', 30)
            historical_data = data.get('historical_data', [])

            if not company_id or not historical_data:
                return jsonify({'error': 'Missing required fields'}), 400

            if len(historical_data) < MIN_REVENUE_POINTS:
                # Fallback ke perhitungan statistik sederhana kalau data historis
                # belum cukup untuk training ML yang wajar
                return PredictionController._fallback_revenue(
                    company_id, period_days, historical_data
                )

            model = RevenuePredictionModel(company_id)
            metrics = model.train(historical_data)
            model.save()

            predictions = model.predict(future_days=period_days)
            predicted_total = float(np.sum(predictions))
            predicted_daily_avg = float(np.mean(predictions))

            recent_avg = np.mean(historical_data[-7:])
            older_avg = np.mean(historical_data[:-7]) if len(historical_data) > 7 else historical_data[0]
            trend = 'up' if recent_avg > older_avg else 'down' if recent_avg < older_avg else 'stable'

            return jsonify({
                'status': 'success',
                'method': 'machine_learning',
                'model': 'RandomForestRegressor',
                'company_id': company_id,
                'prediction': {
                    'period_days': period_days,
                    'predicted_daily_average': round(predicted_daily_avg, 2),
                    'predicted_total': round(predicted_total, 2),
                    'daily_predictions': [round(p, 2) for p in predictions],
                    'trend': trend,
                },
                'model_metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error in predict_revenue: {str(e)}')
            return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

    @staticmethod
    def _fallback_revenue(company_id, period_days, historical_data):
        """Fallback statistik untuk data historis yang terlalu sedikit untuk ML."""
        if len(historical_data) < 2:
            return jsonify({'error': 'Insufficient historical data'}), 400

        recent_avg = np.mean(historical_data[-7:]) if len(historical_data) >= 7 else np.mean(historical_data)
        older_avg = np.mean(historical_data[:-7]) if len(historical_data) > 7 else historical_data[0]
        trend = (recent_avg - older_avg) / older_avg if older_avg != 0 else 0
        predicted_daily_revenue = recent_avg * (1 + trend * 0.5)
        predicted_total = predicted_daily_revenue * period_days

        return jsonify({
            'status': 'success',
            'method': 'statistical_fallback',
            'note': f'Data historis < {MIN_REVENUE_POINTS} titik, memakai fallback statistik (bukan ML)',
            'company_id': company_id,
            'prediction': {
                'period_days': period_days,
                'predicted_daily_average': round(float(predicted_daily_revenue), 2),
                'predicted_total': round(float(predicted_total), 2),
                'confidence': 0.75,
                'trend': 'up' if trend > 0 else 'down' if trend < 0 else 'stable',
            },
            'timestamp': datetime.utcnow().isoformat(),
        }), 200

    @staticmethod
    def predict_demand():
        """
        Prediksi demand untuk jenis service tertentu, pakai RandomForestRegressor.

        Expected data:
        {
            "company_id": 1,
            "service_type": "regular_wash",
            "period_days": 7,
            "historical_orders": [5, 8, 6, 7, 9, 8, 7, ...]
        }
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({'error': 'No data provided'}), 400

            company_id = data.get('company_id')
            service_type = data.get('service_type')
            period_days = data.get('period_days', 7)
            historical_orders = data.get('historical_orders', [])

            if not company_id or not service_type or not historical_orders:
                return jsonify({'error': 'Missing required fields'}), 400

            if len(historical_orders) < MIN_DEMAND_POINTS:
                return PredictionController._fallback_demand(
                    company_id, service_type, period_days, historical_orders
                )

            model = DemandPredictionModel(company_id, service_type)
            metrics = model.train(historical_orders)
            model.save()

            predictions = model.predict(future_days=period_days)
            estimated = int(round(np.mean(predictions)))
            std = float(np.std(predictions)) if len(predictions) > 1 else 0.0

            return jsonify({
                'status': 'success',
                'method': 'machine_learning',
                'model': 'RandomForestRegressor',
                'company_id': company_id,
                'service_type': service_type,
                'prediction': {
                    'period_days': period_days,
                    'estimated_orders': estimated,
                    'daily_predictions': predictions,
                    'range': {
                        'min': max(0, round(estimated - std)),
                        'max': round(estimated + std),
                    },
                },
                'model_metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error in predict_demand: {str(e)}')
            return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

    @staticmethod
    def _fallback_demand(company_id, service_type, period_days, historical_orders):
        """Fallback statistik untuk data historis yang terlalu sedikit untuk ML."""
        avg_orders = np.mean(historical_orders)
        std_orders = np.std(historical_orders)

        return jsonify({
            'status': 'success',
            'method': 'statistical_fallback',
            'note': f'Data historis < {MIN_DEMAND_POINTS} titik, memakai fallback statistik (bukan ML)',
            'company_id': company_id,
            'service_type': service_type,
            'prediction': {
                'period_days': period_days,
                'estimated_orders': round(float(avg_orders)),
                'range': {
                    'min': max(0, round(float(avg_orders - std_orders))),
                    'max': round(float(avg_orders + std_orders)),
                },
                'confidence': 0.70,
            },
            'timestamp': datetime.utcnow().isoformat(),
        }), 200

    @staticmethod
    def predict_churn():
        """
        Prediksi kemungkinan customer churn, pakai RandomForestClassifier.
        Model dilatih sekali (lazy, pakai data sintetis) lalu dipakai berulang.

        Expected data:
        {
            "company_id": 1,
            "days_last_order": 15,
            "total_orders": 25,
            "avg_order_value": 150000,
            "membership_days": 365
        }
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({'error': 'No data provided'}), 400

            company_id = data.get('company_id')
            days_last_order = data.get('days_last_order', 0)
            total_orders = data.get('total_orders', 0)
            avg_order_value = data.get('avg_order_value', 0)
            membership_days = data.get('membership_days', 0)

            if company_id is None:
                return jsonify({'error': 'Missing company_id'}), 400

            model = ChurnPredictionModel(company_id)
            model_metrics = None

            if not model.load():
                # Belum ada model tersimpan -> training sekali pakai data sintetis
                X, y = generate_churn_dataset(n_samples=600, seed=company_id)
                model_metrics = model.train(X, y)
                model.save()
                logger.info(f'Churn model auto-trained (bootstrap) untuk company {company_id}')
            else:
                model_metrics = model.metrics

            features = [days_last_order, total_orders, avg_order_value, membership_days]
            churn_score = model.predict(features)

            risk_level = 'high' if churn_score > 0.7 else 'medium' if churn_score > 0.4 else 'low'

            return jsonify({
                'status': 'success',
                'method': 'machine_learning',
                'model': 'RandomForestClassifier',
                'company_id': company_id,
                'prediction': {
                    'churn_risk_score': round(churn_score, 3),
                    'risk_level': risk_level,
                    'days_since_last_order': days_last_order,
                    'total_orders': total_orders,
                    'recommendation': 'Send re-engagement offer' if risk_level == 'high' else 'Monitor customer',
                },
                'model_metrics': model_metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error in predict_churn: {str(e)}')
            return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

    @staticmethod
    def get_recommendation():
        """
        Get business recommendations berdasarkan data.
        Ini tetap rule-based (expert system), karena sifatnya business logic
        eksplisit, bukan sesuatu yang perlu "dipelajari" dari data.

        Expected data:
        {
            "company_id": 1,
            "total_revenue": 5000000,
            "order_count": 200,
            "avg_order_value": 25000,
            "customer_count": 50,
            "churn_rate": 0.05
        }
        """
        try:
            data = request.get_json()

            if not data:
                return jsonify({'error': 'No data provided'}), 400

            company_id = data.get('company_id')
            total_revenue = data.get('total_revenue', 0)
            order_count = data.get('order_count', 0)
            avg_order_value = data.get('avg_order_value', 0)
            customer_count = data.get('customer_count', 0)
            churn_rate = data.get('churn_rate', 0)

            if company_id is None:
                return jsonify({'error': 'Missing company_id'}), 400

            recommendations = []

            if customer_count > 0:
                revenue_per_customer = total_revenue / customer_count
                if revenue_per_customer < 50000:
                    recommendations.append({
                        'category': 'upsell',
                        'message': 'Revenue per customer masih rendah. Pertimbangkan upsell produk premium.',
                        'priority': 'high',
                    })

            if churn_rate > 0.1:
                recommendations.append({
                    'category': 'retention',
                    'message': 'Churn rate tinggi. Implementasikan loyalty program.',
                    'priority': 'high',
                })

            if order_count > 100:
                recommendations.append({
                    'category': 'efficiency',
                    'message': 'Volume order tinggi. Optimalkan operational efficiency.',
                    'priority': 'medium',
                })

            if avg_order_value > 30000:
                recommendations.append({
                    'category': 'expansion',
                    'message': 'Average order value bagus. Pertimbangkan ekspansi layanan.',
                    'priority': 'medium',
                })

            if not recommendations:
                recommendations.append({
                    'category': 'general',
                    'message': 'Bisnis Anda berjalan stabil. Pertahankan performance saat ini.',
                    'priority': 'low',
                })

            return jsonify({
                'status': 'success',
                'method': 'rule_based',
                'company_id': company_id,
                'metrics': {
                    'total_revenue': total_revenue,
                    'order_count': order_count,
                    'customer_count': customer_count,
                    'avg_order_value': avg_order_value,
                    'churn_rate': churn_rate,
                },
                'recommendations': recommendations,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error in get_recommendation: {str(e)}')
            return jsonify({'error': 'Recommendation failed', 'details': str(e)}), 500


# Create singleton instance
prediction_controller = PredictionController()
