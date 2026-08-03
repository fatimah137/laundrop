"""
Model Machine Learning untuk prediksi churn (klasifikasi biner).

Beda dengan revenue/demand yang berbasis time-series, model churn ini
memprediksi 1 customer sekaligus berdasarkan fitur perilakunya. Karena
prediksi per-customer tidak punya "data historis" untuk dilatih tiap kali
request datang, model ini dilatih SEKALI (pakai dataset sintetis dari
data_generator.py) lalu disimpan ke disk dan dipakai berulang kali untuk
prediksi (load-once, predict-many).
"""
import os
import logging
from datetime import datetime

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models'
)

# Urutan fitur ini HARUS konsisten antara training dan prediction
FEATURE_NAMES = ['days_last_order', 'total_orders', 'avg_order_value', 'membership_days']


class ChurnPredictionModel:
    """RandomForest-based churn classifier, per company."""

    def __init__(self, company_id):
        self.company_id = company_id
        self.model = RandomForestClassifier(
            n_estimators=200, max_depth=6, random_state=42, class_weight='balanced'
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.metrics = {}
        self.model_path = os.path.join(
            MODELS_DIR, f'churn_model_company_{company_id}.joblib'
        )

    def train(self, X, y, test_size=0.2):
        X = np.array(X, dtype=float)
        y = np.array(y, dtype=int)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        self.model.fit(X_train_scaled, y_train)

        X_test_scaled = self.scaler.transform(X_test)
        preds = self.model.predict(X_test_scaled)
        proba = self.model.predict_proba(X_test_scaled)[:, 1]

        acc = float(accuracy_score(y_test, preds))
        try:
            auc = float(roc_auc_score(y_test, proba))
        except ValueError:
            auc = None

        self.is_trained = True
        self.metrics = {
            'accuracy': acc,
            'roc_auc': auc,
            'train_samples': int(len(X_train)),
            'test_samples': int(len(X_test)),
        }
        return self.metrics

    def predict(self, features):
        """
        features: list [days_last_order, total_orders, avg_order_value, membership_days]
        Return: probabilitas churn (float, 0-1)
        """
        if not self.is_trained:
            raise RuntimeError('Model belum dilatih. Panggil train() dulu atau load() model tersimpan.')

        X = np.array([features], dtype=float)
        X_scaled = self.scaler.transform(X)
        proba = self.model.predict_proba(X_scaled)[0, 1]
        return float(proba)

    def save(self):
        os.makedirs(MODELS_DIR, exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'company_id': self.company_id,
            'metrics': self.metrics,
            'trained_at': datetime.utcnow().isoformat(),
        }, self.model_path)
        logger.info(f'Churn model saved: {self.model_path}')

    def load(self):
        if not os.path.exists(self.model_path):
            return False
        data = joblib.load(self.model_path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.metrics = data.get('metrics', {})
        self.is_trained = True
        return True
