from app import create_app

app = create_app()

def handler(event, context):
    from aws_lambda_wsgi import response
    return response(app, event, context)
