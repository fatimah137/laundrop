"""
Controller untuk model training - training model ML sungguhan (bukan cuma
simpan mean/std). Kalau request tidak menyertakan training_data, otomatis
memakai data sintetis dari ml_models/data_generator.py (lihat catatan di
file tersebut soal cara pindah ke data riil nanti).
"""
from flask import request, jsonify
import logging
import os
from datetime import datetime

from ml_models.revenue_model import RevenuePredictionModel, MODELS_DIR
from ml_models.demand_model import DemandPredictionModel
from ml_models.churn_model import ChurnPredictionModel
from ml_models.data_generator import (
    generate_revenue_series,
    generate_demand_series,
    generate_churn_dataset,
)

logger = logging.getLogger(__name__)


class TrainingController:
    """Controller untuk model training"""

    @staticmethod
    def train_revenue_model():
        """
        Train revenue prediction model.

        Expected data (opsional):
        {
            "company_id": 1,
            "training_data": { "revenues": [100000, 120000, ...] }
        }
        Kalau "training_data" tidak dikirim, pakai data sintetis.
        """
        try:
            data = request.get_json(silent=True) or {}

            company_id = data.get('company_id')
            if not company_id:
                return jsonify({'error': 'Missing company_id'}), 400

            training_data = data.get('training_data', {})
            revenues = training_data.get('revenues', [])

            used_synthetic = False
            if len(revenues) < 10:
                revenues = generate_revenue_series(days=180, seed=company_id)
                used_synthetic = True

            model = RevenuePredictionModel(company_id)
            metrics = model.train(revenues)
            model.save()

            logger.info(f'Revenue model trained for company {company_id} (synthetic={used_synthetic})')

            return jsonify({
                'status': 'success',
                'message': 'Model training completed',
                'company_id': company_id,
                'used_synthetic_data': used_synthetic,
                'data_points': len(revenues),
                'model_metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error training revenue model: {str(e)}')
            return jsonify({'error': 'Training failed', 'details': str(e)}), 500

    @staticmethod
    def train_demand_model():
        """
        Train demand prediction model.

        Expected data (opsional):
        {
            "company_id": 1,
            "service_type": "regular_wash",
            "training_data": { "orders": [5, 8, 6, ...] }
        }
        Kalau "training_data" tidak dikirim, pakai data sintetis.
        """
        try:
            data = request.get_json(silent=True) or {}

            company_id = data.get('company_id')
            if not company_id:
                return jsonify({'error': 'Missing company_id'}), 400

            service_type = data.get('service_type', 'general')
            training_data = data.get('training_data', {})
            orders = training_data.get('orders', [])

            used_synthetic = False
            if len(orders) < 10:
                orders = generate_demand_series(days=180, seed=company_id)
                used_synthetic = True

            model = DemandPredictionModel(company_id, service_type)
            metrics = model.train(orders)
            model.save()

            logger.info(
                f'Demand model trained for company {company_id}, service: {service_type} '
                f'(synthetic={used_synthetic})'
            )

            return jsonify({
                'status': 'success',
                'message': 'Demand model training completed',
                'company_id': company_id,
                'service_type': service_type,
                'used_synthetic_data': used_synthetic,
                'data_points': len(orders),
                'model_metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error training demand model: {str(e)}')
            return jsonify({'error': 'Training failed', 'details': str(e)}), 500

    @staticmethod
    def train_churn_model():
        """
        Train churn prediction model.

        Expected data:
        {
            "company_id": 1
        }
        Selalu pakai data sintetis untuk sekarang (belum ada data churn riil
        yang berlabel).
        """
        try:
            data = request.get_json(silent=True) or {}

            company_id = data.get('company_id')
            if not company_id:
                return jsonify({'error': 'Missing company_id'}), 400

            X, y = generate_churn_dataset(n_samples=600, seed=company_id)

            model = ChurnPredictionModel(company_id)
            metrics = model.train(X, y)
            model.save()

            logger.info(f'Churn model trained for company {company_id}')

            return jsonify({
                'status': 'success',
                'message': 'Churn model training completed',
                'company_id': company_id,
                'used_synthetic_data': True,
                'data_points': len(X),
                'model_metrics': metrics,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error training churn model: {str(e)}')
            return jsonify({'error': 'Training failed', 'details': str(e)}), 500

    @staticmethod
    def get_models_status():
        """Get status of all trained models"""
        try:
            models_list = []

            if os.path.exists(MODELS_DIR):
                for filename in os.listdir(MODELS_DIR):
                    if filename.endswith('.joblib'):
                        filepath = os.path.join(MODELS_DIR, filename)
                        file_size = os.path.getsize(filepath)
                        mod_time = datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()

                        models_list.append({
                            'name': filename,
                            'size_bytes': file_size,
                            'modified_at': mod_time,
                        })

            return jsonify({
                'status': 'success',
                'models_count': len(models_list),
                'models': models_list,
                'timestamp': datetime.utcnow().isoformat(),
            }), 200

        except Exception as e:
            logger.error(f'Error getting models status: {str(e)}')
            return jsonify({'error': 'Failed to get models status', 'details': str(e)}), 500


# Create singleton instance
training_controller = TrainingController()
