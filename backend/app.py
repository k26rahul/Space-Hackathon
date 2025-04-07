from flask import Flask
from flask_cors import CORS
from config import Config
from routes import api_routes

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

app.register_blueprint(api_routes)

if __name__ == '__main__':
  app.run(
      host=app.config['HOST'],
      port=app.config['PORT'],
      debug=app.config['DEBUG']
  )
