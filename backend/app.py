from flask import Flask
from backend.config import Config, db
from backend.routes import init_routes

def create_app():
    app = Flask(__name__)
    # Load our Config settings
    app.config.from_object(Config)

    # Initialize SQLAlchemy
    db.init_app(app)

    # Make sure the upload folder exists
    import os
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register our routes
    init_routes(app)

    return app

# Allow `python -m backend.app`
if __name__ == "__main__":
    create_app().run(debug=True)
