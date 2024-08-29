from flask import redirect, request
from app import create_app
from flask_jwt_extended import JWTManager
from flask_cognito import CognitoAuth
from flask_cors import CORS

app = create_app()
CORS(app)
jwt = JWTManager(app)
cogauth = CognitoAuth(app)

app.config['JWT_ALGORITHM'] = 'RS256'
app.config['JWT_SECRET_KEY'] = open('private.pem').read()
app.config['JWT_PUBLIC_KEY'] = open('public.pem').read()

@app.before_request
def before_request():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
    
def handler(event, context):
    from aws_lambda_wsgi import response
    return response(app, event, context)
