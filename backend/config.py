# backend/config.py

import os
from flask_sqlalchemy import SQLAlchemy

# ─── DATABASE & SQLAlchemy SETUP ──────────────────────────────────────────
db = SQLAlchemy()

class Config:
    # Use $DATABASE_URI or fall back to a local SQLite file:
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///grading.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Folder for storing uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')


# ─── MODELS ────────────────────────────────────────────────────────────────
class Submission(db.Model):
    __tablename__ = 'submissions'

    id              = db.Column(db.Integer, primary_key=True)
    student_name    = db.Column(db.String(128), nullable=False)
    birthday_prefix = db.Column(db.String(10), nullable=False)
    master_zip      = db.Column(db.String(256), nullable=False)
    student_zip     = db.Column(db.String(256), nullable=False)
    final_score     = db.Column(db.Float, nullable=False)
    created_at      = db.Column(db.DateTime, server_default=db.func.now())


class RouterResult(db.Model):
    __tablename__ = 'router_results'

    id             = db.Column(db.Integer, primary_key=True)
    submission_id  = db.Column(db.Integer, db.ForeignKey('submissions.id'), nullable=False)
    router_name    = db.Column(db.String(128), nullable=False)
    score          = db.Column(db.Float, nullable=False)
    feedback       = db.Column(db.Text, nullable=False)
    diff           = db.Column(db.Text, nullable=True)
