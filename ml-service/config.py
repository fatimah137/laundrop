import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', True)
    PORT = int(os.getenv('PORT', 5000))
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8000').split(',')
    
    # Laravel API Integration
    LARAVEL_API_URL = os.getenv('LARAVEL_API_URL', 'http://localhost:8000/api')
    LARAVEL_API_KEY = os.getenv('LARAVEL_API_KEY', '')
    
    # Model paths
    MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
    DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
    
class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
