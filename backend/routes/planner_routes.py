from flask import Blueprint, request, jsonify
from models import Subject
from extensions import db
from utils.auth_middleware import token_required
from utils.planner_logic import generate_timetable

planner_bp = Blueprint('planner', __name__)

@planner_bp.route('/generate-plan', methods=['POST'])
@token_required
def build_plan(current_user):
    data = request.json
    subjects_data = data.get('subjects') # List of dicts [{'name': 'Math', 'difficulty': 'hard'}]
    total_hours = data.get('available_hours')

    if not subjects_data or not total_hours:
        return jsonify({'error': 'Missing subjects or available hours'}), 400

    # First, save subjects if they are new or just use for plan
    subjects_list = []
    for s in subjects_data:
        # Check if subject exists for user, else create
        subject = Subject.query.filter_by(user_id=current_user.id, name=s['name']).first()
        if not subject:
            subject = Subject(user_id=current_user.id, name=s['name'], difficulty=s['difficulty'])
            db.session.add(subject)
        elif subject.difficulty != s['difficulty']:
            subject.difficulty = s['difficulty']
        subjects_list.append({'name': subject.name, 'difficulty': subject.difficulty})
    
    db.session.commit()

    timetable = generate_timetable(subjects_list, float(total_hours))
    return jsonify({'plan': timetable}), 200

@planner_bp.route('/subjects', methods=['GET'])
@token_required
def get_subjects(current_user):
    subjects = Subject.query.filter_by(user_id=current_user.id).all()
    output = [{'id': s.id, 'name': s.name, 'difficulty': s.difficulty} for s in subjects]
    return jsonify(output), 200
