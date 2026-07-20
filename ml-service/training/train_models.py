"""
Sample training script untuk demo ML models
Bisa dijalankan standalone atau dipanggil dari API
"""
import os
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import joblib
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RevenuePredictionModel:
    """Model untuk prediksi revenue"""
    
    def __init__(self, company_id):
        self.company_id = company_id
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.model_path = os.path.join(
            os.path.dirname(__file__), 
            f'../models/revenue_model_company_{company_id}.joblib'
        )
    
    def generate_sample_data(self, days=90):
        """Generate sample historical revenue data"""
        dates = [datetime.now() - timedelta(days=i) for i in range(days, 0, -1)]
        
        # Generate realistic revenue data with trend and seasonality
        base_revenue = 1000000
        trend = np.linspace(0, 200000, days)
        seasonality = 300000 * np.sin(np.linspace(0, 4*np.pi, days))
        noise = np.random.normal(0, 100000, days)
        
        revenues = base_revenue + trend + seasonality + noise
        revenues = np.maximum(revenues, 500000)  # Minimum revenue
        
        return {
            'dates': dates,
            'revenues': revenues.tolist()
        }
    
    def train(self, historical_revenues):
        """Train model dengan historical data"""
        try:
            X = np.arange(len(historical_revenues)).reshape(-1, 1)
            y = np.array(historical_revenues)
            
            X_scaled = self.scaler.fit_transform(X)
            self.model.fit(X_scaled, y)
            
            logger.info(f"Model trained for company {self.company_id}")
            self.save()
            
            return {
                'status': 'success',
                'company_id': self.company_id,
                'training_samples': len(historical_revenues),
                'model_score': self.model.score(X_scaled, y)
            }
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    def predict(self, future_days=30):
        """Predict revenue untuk future days"""
        try:
            last_idx = 90
            future_indices = np.arange(last_idx, last_idx + future_days).reshape(-1, 1)
            future_indices_scaled = self.scaler.transform(future_indices)
            
            predictions = self.model.predict(future_indices_scaled)
            return predictions.tolist()
        except Exception as e:
            logger.error(f"Error predicting: {str(e)}")
            raise
    
    def save(self):
        """Save model ke disk"""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'company_id': self.company_id,
            'trained_at': datetime.utcnow().isoformat()
        }, self.model_path)
        logger.info(f"Model saved to {self.model_path}")
    
    def load(self):
        """Load model dari disk"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.scaler = data['scaler']
            logger.info(f"Model loaded from {self.model_path}")
            return True
        return False

def demo_training():
    """Demo: Train model dengan sample data"""
    logger.info("=== Demo Revenue Prediction Model ===")
    
    # Create and train model
    model = RevenuePredictionModel(company_id=1)
    
    # Generate sample data
    sample_data = model.generate_sample_data(days=90)
    logger.info(f"Generated {len(sample_data['revenues'])} sample data points")
    
    # Train model
    result = model.train(sample_data['revenues'])
    logger.info(f"Training result: {result}")
    
    # Make predictions
    predictions = model.predict(future_days=30)
    logger.info(f"Next 30 days predictions: {[round(p, 0) for p in predictions[:5]]} ... (showing first 5)")
    
    return model, sample_data, predictions

if __name__ == '__main__':
    model, data, predictions = demo_training()
