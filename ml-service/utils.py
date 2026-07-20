"""
Utility functions untuk ML service
"""
import os
import requests
import logging

logger = logging.getLogger(__name__)

class LaravelIntegration:
    """Helper untuk integrate dengan Laravel API"""
    
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {'Authorization': f'Bearer {api_key}'} if api_key else {}
    
    def get_company_data(self, company_id):
        """Ambil data company dari Laravel"""
        try:
            url = f"{self.base_url}/companies/{company_id}"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching company data: {str(e)}")
            return None
    
    def get_company_orders(self, company_id, limit=100):
        """Ambil orders dari Laravel"""
        try:
            url = f"{self.base_url}/companies/{company_id}/orders"
            params = {'limit': limit, 'sort': '-created_at'}
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching orders: {str(e)}")
            return None
    
    def get_company_revenue(self, company_id, days=30):
        """Ambil revenue data dari Laravel untuk last N days"""
        try:
            url = f"{self.base_url}/companies/{company_id}/revenue"
            params = {'days': days}
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching revenue: {str(e)}")
            return None

def format_response(data, message="Success"):
    """Format standard response"""
    return {
        'status': 'success',
        'message': message,
        'data': data
    }

def format_error(error, code=400):
    """Format error response"""
    return {
        'status': 'error',
        'error': str(error),
        'code': code
    }
