from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
import datetime

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username == 'user' and password == 'password':
        access_token = create_access_token(identity={'username': username},
                                           expires_delta=datetime.timedelta(hours=1))
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401
