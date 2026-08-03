"""
API Routes untuk ML Service
"""
from flask import Blueprint
from .controllers.prediction_controller import prediction_controller
from .controllers.training_controller import training_controller


def register_routes(app):
    """Register semua API routes"""

    # Prediction routes
    @app.route('/api/predict/revenue', methods=['POST'])
    def predict_revenue():
        return prediction_controller.predict_revenue()

    @app.route('/api/predict/demand', methods=['POST'])
    def predict_demand():
        return prediction_controller.predict_demand()

    @app.route('/api/predict/churn', methods=['POST'])
    def predict_churn():
        return prediction_controller.predict_churn()

    @app.route('/api/predict/recommendation', methods=['POST'])
    def get_recommendation():
        return prediction_controller.get_recommendation()

    # Training routes
    @app.route('/api/train/revenue', methods=['POST'])
    def train_revenue_model():
        return training_controller.train_revenue_model()

    @app.route('/api/train/demand', methods=['POST'])
    def train_demand_model():
        return training_controller.train_demand_model()

    @app.route('/api/train/churn', methods=['POST'])
    def train_churn_model():
        return training_controller.train_churn_model()

    @app.route('/api/models/status', methods=['GET'])
    def get_models_status():
        return training_controller.get_models_status()
