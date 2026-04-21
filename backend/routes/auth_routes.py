from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from models import User
from extensions import db
from utils.auth_middleware import token_required
import os

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = 'super-secret-key-study-planner'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    if not name or not email or not password:
        return jsonify({"error": "Missing data"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400
    new_user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not check_password_hash(user.password_hash, data.get('password', '')):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({"id": current_user.id, "name": current_user.name, "email": current_user.email}), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    if 'name' in data and data['name'].strip():
        current_user.name = data['name'].strip()
    if 'email' in data and data['email'].strip():
        if User.query.filter(User.email == data['email'], User.id != current_user.id).first():
            return jsonify({"error": "Email already in use"}), 400
        current_user.email = data['email'].strip()
    if 'new_password' in data and data['new_password']:
        old_pw = data.get('current_password', '')
        if not check_password_hash(current_user.password_hash, old_pw):
            return jsonify({"error": "Current password is incorrect"}), 400
        current_user.password_hash = generate_password_hash(data['new_password'])
    db.session.commit()
    return jsonify({"message": "Profile updated", "user": {"id": current_user.id, "name": current_user.name, "email": current_user.email}}), 200
