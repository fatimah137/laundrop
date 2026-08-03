"""
Synthetic data generators untuk keperluan training model ML.

CATATAN PENTING:
Fungsi-fungsi di file ini menghasilkan data SINTETIS (buatan/simulasi),
karena data historis riil dari Laundrop (order, revenue, customer) masih
terbatas jumlahnya untuk training model yang layak.

Ketika data riil di database sudah cukup banyak, ganti isi fungsi-fungsi ini
supaya mengambil data lewat `utils.LaravelIntegration` (misal
`get_company_revenue`, `get_company_orders`, dst) alih-alih generate data
acak. Signature fungsi (parameter & return value) sengaja dibuat konsisten
supaya modul model (revenue_model.py, demand_model.py, churn_model.py) TIDAK
perlu diubah sama sekali saat nanti pindah ke data riil.
"""
import numpy as np


def generate_revenue_series(days=180, seed=None):
    """
    Generate data revenue harian sintetis dengan tren naik + pola mingguan.

    Return: list of float, panjang = `days`
    """
    rng = np.random.default_rng(seed)
    base = 1_000_000
    trend = np.linspace(0, 400_000, days)
    weekly_pattern = 250_000 * np.sin(np.linspace(0, (days / 7) * 2 * np.pi, days))
    noise = rng.normal(0, 80_000, days)

    revenues = base + trend + weekly_pattern + noise
    revenues = np.maximum(revenues, 300_000)  # revenue tidak boleh negatif/terlalu kecil
    return revenues.tolist()


def generate_demand_series(days=180, seed=None):
    """
    Generate data jumlah order harian sintetis dengan tren naik + pola mingguan.

    Return: list of int, panjang = `days`
    """
    rng = np.random.default_rng(seed)
    base = 12
    trend = np.linspace(0, 6, days)
    weekly_pattern = 5 * np.sin(np.linspace(0, (days / 7) * 2 * np.pi, days))
    noise = rng.normal(0, 2, days)

    orders = base + trend + weekly_pattern + noise
    orders = np.maximum(np.round(orders), 0)
    return orders.astype(int).tolist()


def generate_churn_dataset(n_samples=600, seed=None):
    """
    Generate dataset sintetis untuk training model klasifikasi churn.

    Fitur (dalam urutan ini):
        - days_last_order   : jumlah hari sejak order terakhir
        - total_orders       : total jumlah order sepanjang jadi customer
        - avg_order_value    : rata-rata nilai order (Rupiah)
        - membership_days    : sudah berapa lama jadi customer (hari)

    Label churn dibuat dari heuristik bisnis yang masuk akal (semakin lama
    tidak order & semakin sedikit total order -> makin berisiko churn),
    ditambah noise acak supaya tidak terlalu "sempurna" untuk dipelajari
    model (mensimulasikan variasi perilaku customer di dunia nyata).

    Return: (X, y) -> X = list of list[float], y = list of int (0/1)
    """
    rng = np.random.default_rng(seed)

    days_last_order = rng.integers(0, 120, n_samples)
    total_orders = rng.integers(1, 60, n_samples)
    avg_order_value = rng.normal(120_000, 40_000, n_samples).clip(20_000, 400_000)
    membership_days = rng.integers(10, 900, n_samples)

    churn_score = (
        (days_last_order / 90)
        - (total_orders / 80)
        - (membership_days / 1800)
    )
    churn_score = churn_score + rng.normal(0, 0.15, n_samples)
    churn = (churn_score > 0.15).astype(int)

    X = np.column_stack([days_last_order, total_orders, avg_order_value, membership_days])
    return X.tolist(), churn.tolist()
