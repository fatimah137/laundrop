"""
Laundrop ML Service
Flask API untuk Machine Learning predictions
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})

# Import routes
from api.routes import register_routes
register_routes(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'Laundrop ML Service'
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': str(error)
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'Terjadi kesalahan pada server'
    }), 500

if __name__ == '__main__':
    port = app.config['PORT']
    logger.info(f"Starting Laundrop ML Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
