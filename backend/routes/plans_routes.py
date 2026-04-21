from flask import Blueprint, request, jsonify
from models import StudyPlan
from extensions import db
from utils.auth_middleware import token_required
from datetime import datetime

plans_bp = Blueprint('plans', __name__)

@plans_bp.route('/', methods=['GET'])
@token_required
def get_plans(current_user):
    plans = StudyPlan.query.filter_by(user_id=current_user.id).order_by(StudyPlan.id.desc()).all()
    return jsonify([{
        'id': p.id, 'name': p.name,
        'plan_data': p.plan_data, 'created_at': p.created_at
    } for p in plans]), 200

@plans_bp.route('/', methods=['POST'])
@token_required
def save_plan(current_user):
    data = request.json
    name = data.get('name', 'My Study Plan')
    plan_data = data.get('plan_data')
    if not plan_data:
        return jsonify({'error': 'Missing plan_data'}), 400

    import json
    plan = StudyPlan(
        user_id=current_user.id,
        name=name,
        plan_data=json.dumps(plan_data) if isinstance(plan_data, list) else plan_data,
        created_at=datetime.now().strftime('%Y-%m-%d %H:%M')
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify({'id': plan.id, 'message': 'Plan saved'}), 201

@plans_bp.route('/<int:plan_id>', methods=['DELETE'])
@token_required
def delete_plan(current_user, plan_id):
    plan = StudyPlan.query.filter_by(id=plan_id, user_id=current_user.id).first()
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    db.session.delete(plan)
    db.session.commit()
    return jsonify({'message': 'Plan deleted'}), 200
