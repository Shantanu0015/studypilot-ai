from flask import Blueprint, request, jsonify
from models import UserGoal
from extensions import db
from utils.auth_middleware import token_required

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/', methods=['GET'])
@token_required
def get_goal(current_user):
    goal = UserGoal.query.filter_by(user_id=current_user.id).first()
    return jsonify({'weekly_hours_goal': goal.weekly_hours_goal if goal else 10.0}), 200

@goals_bp.route('/', methods=['POST'])
@token_required
def set_goal(current_user):
    hours = request.json.get('weekly_hours_goal', 10.0)
    goal = UserGoal.query.filter_by(user_id=current_user.id).first()
    if goal:
        goal.weekly_hours_goal = hours
    else:
        goal = UserGoal(user_id=current_user.id, weekly_hours_goal=hours)
        db.session.add(goal)
    db.session.commit()
    return jsonify({'message': 'Goal updated', 'weekly_hours_goal': hours}), 200
