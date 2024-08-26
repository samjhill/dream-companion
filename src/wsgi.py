from flask import redirect, request
from app import create_app

app = create_app()

@app.before_request
def before_request():
    if request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)
    
def handler(event, context):
    from aws_lambda_wsgi import response
    return response(app, event, context)
