from app import create_app
from flask_jwt_extended import JWTManager

app = create_app()
jwt = JWTManager(app)
app.config['JWT_ALGORITHM'] = 'RS256'
app.config['JWT_SECRET_KEY'] = open('private.pem').read()
app.config['JWT_PUBLIC_KEY'] = open('public.pem').read()

if __name__ == '__main__':
    app.run(debug=True, port=8888)
