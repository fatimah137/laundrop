"""
Model Machine Learning untuk prediksi demand (jumlah order).

Sama seperti revenue_model.py, tapi output-nya jumlah order (integer) dan
dipisah per company + per service_type.
"""
import os
import logging
from datetime import datetime

import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models'
)

MIN_TRAINING_POINTS = 10


class DemandPredictionModel:
    """RandomForest-based demand forecasting model, per company + service_type."""

    def __init__(self, company_id, service_type='general'):
        self.company_id = company_id
        self.service_type = service_type
        self.model = RandomForestRegressor(n_estimators=200, max_depth=6, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.n_history = 0
        self.metrics = {}
        self.model_path = os.path.join(
            MODELS_DIR, f'demand_model_company_{company_id}_{service_type}.joblib'
        )

    @staticmethod
    def _build_features(n_days, start_idx=0):
        idx = np.arange(start_idx, start_idx + n_days)
        dow = idx % 7
        dow_sin = np.sin(2 * np.pi * dow / 7)
        dow_cos = np.cos(2 * np.pi * dow / 7)
        week = idx // 7
        return np.column_stack([idx, dow_sin, dow_cos, week])

    def train(self, orders, test_size=0.2):
        orders = np.array(orders, dtype=float)
        n = len(orders)

        if n < MIN_TRAINING_POINTS:
            raise ValueError(
                f'Minimal {MIN_TRAINING_POINTS} titik data diperlukan untuk training ML yang wajar'
            )

        X = self._build_features(n)
        y = orders

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, shuffle=False
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_train_scaled, y_train)

        if len(X_test) > 0:
            X_test_scaled = self.scaler.transform(X_test)
            preds = self.model.predict(X_test_scaled)
            mae = float(mean_absolute_error(y_test, preds))
            r2 = float(r2_score(y_test, preds)) if len(y_test) > 1 else None
        else:
            mae, r2 = None, None

        self.is_trained = True
        self.n_history = n
        self.metrics = {
            'mae': mae,
            'r2_score': r2,
            'train_samples': int(len(X_train)),
            'test_samples': int(len(X_test)),
        }
        return self.metrics

    def predict(self, future_days=7):
        if not self.is_trained:
            raise RuntimeError('Model belum dilatih. Panggil train() dulu atau load() model tersimpan.')

        X_future = self._build_features(future_days, start_idx=self.n_history)
        X_future_scaled = self.scaler.transform(X_future)
        preds = self.model.predict(X_future_scaled)
        preds = np.maximum(np.round(preds), 0)
        return preds.astype(int).tolist()

    def save(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'company_id': self.company_id,
            'service_type': self.service_type,
            'n_history': self.n_history,
            'metrics': self.metrics,
            'trained_at': datetime.utcnow().isoformat(),
        }, self.model_path)
        logger.info(f'Demand model saved: {self.model_path}')

    def load(self):
        if not os.path.exists(self.model_path):
            return False
        data = joblib.load(self.model_path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.n_history = data['n_history']
        self.metrics = data.get('metrics', {})
        self.is_trained = True
        return True
