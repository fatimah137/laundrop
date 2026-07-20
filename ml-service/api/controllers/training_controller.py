"""
Controller untuk model training
"""
from flask import request, jsonify
import logging
import os
from datetime import datetime
import joblib
import numpy as np

logger = logging.getLogger(__name__)

class TrainingController:
    """Controller untuk model training"""
    
    @staticmethod
    def train_revenue_model():
        """
        Train revenue prediction model
        
        Expected data:
        {
            "company_id": 1,
            "training_data": {
                "dates": ["2024-01-01", "2024-01-02", ...],
                "revenues": [100000, 120000, ...]
            }
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No training data provided'}), 400
            
            company_id = data.get('company_id')
            training_data = data.get('training_data', {})
            
            if not company_id or not training_data:
                return jsonify({'error': 'Missing required fields'}), 400
            
            revenues = training_data.get('revenues', [])
            
            if len(revenues) < 5:
                return jsonify({'error': 'Insufficient training data (minimum 5 data points)'}), 400
            
            # Simple model: just store statistics for now
            # In real implementation, you'd use actual ML algorithms
            model_data = {
                'company_id': company_id,
                'mean': float(np.mean(revenues)),
                'std': float(np.std(revenues)),
                'min': float(np.min(revenues)),
                'max': float(np.max(revenues)),
                'data_points': len(revenues),
                'trained_at': datetime.utcnow().isoformat()
            }
            
            # Save model
            model_path = os.path.join(
                os.path.dirname(__file__), 
                f'../../models/revenue_model_company_{company_id}.joblib'
            )
            
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(model_data, model_path)
            
            logger.info(f"Revenue model trained for company {company_id}")
            
            return jsonify({
                'status': 'success',
                'message': 'Model training completed',
                'company_id': company_id,
                'model_stats': model_data,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            logger.error(f"Error training revenue model: {str(e)}")
            return jsonify({'error': 'Training failed', 'details': str(e)}), 500
    
    @staticmethod
    def train_demand_model():
        """
        Train demand prediction model
        
        Expected data:
        {
            "company_id": 1,
            "service_type": "regular_wash",
            "training_data": {
                "orders": [5, 8, 6, 7, 9, 8, 7, ...]
            }
        }
        """
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No training data provided'}), 400
            
            company_id = data.get('company_id')
            service_type = data.get('service_type', 'general')
            training_data = data.get('training_data', {})
            
            if not company_id or not training_data:
                return jsonify({'error': 'Missing required fields'}), 400
            
            orders = training_data.get('orders', [])
            
            if len(orders) < 5:
                return jsonify({'error': 'Insufficient training data (minimum 5 data points)'}), 400
            
            # Store model statistics
            model_data = {
                'company_id': company_id,
                'service_type': service_type,
                'mean': float(np.mean(orders)),
                'std': float(np.std(orders)),
                'min': int(np.min(orders)),
                'max': int(np.max(orders)),
                'data_points': len(orders),
                'trained_at': datetime.utcnow().isoformat()
            }
            
            # Save model
            model_path = os.path.join(
                os.path.dirname(__file__), 
                f'../../models/demand_model_company_{company_id}_{service_type}.joblib'
            )
            
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(model_data, model_path)
            
            logger.info(f"Demand model trained for company {company_id}, service: {service_type}")
            
            return jsonify({
                'status': 'success',
                'message': 'Demand model training completed',
                'company_id': company_id,
                'service_type': service_type,
                'model_stats': model_data,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            logger.error(f"Error training demand model: {str(e)}")
            return jsonify({'error': 'Training failed', 'details': str(e)}), 500
    
    @staticmethod
    def get_models_status():
        """
        Get status of all trained models
        """
        try:
            models_dir = os.path.join(
                os.path.dirname(__file__), 
                '../../models'
            )
            
            models_list = []
            
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith('.joblib'):
                        filepath = os.path.join(models_dir, filename)
                        file_size = os.path.getsize(filepath)
                        mod_time = datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                        
                        models_list.append({
                            'name': filename,
                            'size_bytes': file_size,
                            'modified_at': mod_time
                        })
            
            return jsonify({
                'status': 'success',
                'models_count': len(models_list),
                'models': models_list,
                'timestamp': datetime.utcnow().isoformat()
            }), 200
            
        except Exception as e:
            logger.error(f"Error getting models status: {str(e)}")
            return jsonify({'error': 'Failed to get models status', 'details': str(e)}), 500

# Create singleton instance
training_controller = TrainingController()
