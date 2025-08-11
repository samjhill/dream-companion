from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .auth import auth_bp
from .routes import routes_bp

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)

    # Enable CORS for the /api routes and allow requests from your frontend
    CORS(app, origins=['https://clarasdreamguide.com'], supports_credentials=True)

    # Initialize JWT manager
    jwt = JWTManager(app)

    # Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        """Add CORS headers to all responses"""
        response.headers.add('Access-Control-Allow-Origin', 'https://clarasdreamguide.com')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    # Register blueprints
    with app.app_context():
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(routes_bp, url_prefix='/api')
        return app
