import os
from dotenv import load_dotenv
# Always load .env from the same folder as app.py
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))
from flask import Flask
from extensions import db
from flask_cors import CORS
from sqlalchemy import text, inspect as sa_inspect

from routes.auth_routes import auth_bp
from routes.planner_routes import planner_bp
from routes.tasks_routes import tasks_bp
from routes.analytics_routes import analytics_bp
from routes.plans_routes import plans_bp
from routes.goals_routes import goals_bp
from routes.exams_routes import exams_bp
from routes.revision_routes import revision_bp
from routes.notes_routes import notes_bp
from routes.ai_routes import ai_bp
from routes.admin_routes import admin_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'database.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'studypilot_super_secret_key_2024')

    db.init_app(app)

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(planner_bp,   url_prefix='/api/planner')
    app.register_blueprint(tasks_bp,     url_prefix='/api/tasks')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(plans_bp,     url_prefix='/api/plans')
    app.register_blueprint(goals_bp,     url_prefix='/api/goals')
    app.register_blueprint(exams_bp,     url_prefix='/api/exams')
    app.register_blueprint(revision_bp,  url_prefix='/api/revision')
    app.register_blueprint(notes_bp,     url_prefix='/api/notes')
    app.register_blueprint(ai_bp,        url_prefix='/api/ai')
    app.register_blueprint(admin_bp,     url_prefix='/api/admin')

    with app.app_context():
        db.create_all()           # creates new tables
        _migrate_columns(app)     # safely adds new columns to existing tables

    return app

def _migrate_columns(app):
    """Add new columns to existing tables without destroying data."""
    with app.app_context():
        inspector = sa_inspect(db.engine)
        migrations = [
            ('task',      'deadline', 'VARCHAR(50)'),
            ('task',      'priority', "VARCHAR(20) DEFAULT 'medium'"),
            ('study_log', 'subject',  'VARCHAR(100)'),
        ]
        for table, col, col_type in migrations:
            try:
                existing = [c['name'] for c in inspector.get_columns(table)]
                if col not in existing:
                    db.session.execute(text(f'ALTER TABLE {table} ADD COLUMN {col} {col_type}'))
                    db.session.commit()
            except Exception:
                db.session.rollback()

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
