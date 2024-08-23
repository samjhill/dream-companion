from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .auth import auth_bp
from .routes import routes_bp

def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)

    # Enable CORS for the /api routes and allow requests from your frontend
    CORS(app)

    jwt = JWTManager(app)

    with app.app_context():
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(routes_bp, url_prefix='/api')
        return app
