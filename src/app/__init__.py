from flask import Flask
from flask_cors import CORS
from .config import Config
from .auth import auth_bp
from .routes import routes_bp
from .premium import premium_bp
from .dream_analysis import dream_analysis_bp
from .stripe_integration import stripe_bp

def create_app(config_override=None):
    """Create and configure the Flask application"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)
    
    # Override config if provided
    if config_override:
        app.config.update(config_override)

    # Enable CORS for the /api routes and allow requests from your frontend
    CORS(app, origins=['https://clarasdreamguide.com'], supports_credentials=True)

    # Register blueprints
    with app.app_context():
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(routes_bp, url_prefix='/api')
        app.register_blueprint(premium_bp, url_prefix='/api/premium')
        app.register_blueprint(dream_analysis_bp, url_prefix='/api/analysis')
        app.register_blueprint(stripe_bp, url_prefix='/api/stripe')
        return app
