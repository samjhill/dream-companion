from flask import Response, current_app, request
from app import create_app
from flask_jwt_extended import JWTManager
from flask_cognito import CognitoAuth
from flask_cors import CORS

app = create_app()
cors = CORS(app)
jwt = JWTManager(app)
cogauth = CognitoAuth(app)

app.config['JWT_ALGORITHM'] = 'RS256'
app.config['JWT_SECRET_KEY'] = open('private.pem').read()
app.config['JWT_PUBLIC_KEY'] = open('public.pem').read()

@app.before_request
def basic_authentication():
    if request.method.lower() == 'options':
        return Response()
    
if __name__ == '__main__':
    app.run(debug=True, port=8888)
