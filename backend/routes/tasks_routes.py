from flask import Blueprint, request, jsonify
from models import Task
from extensions import db
from utils.auth_middleware import token_required
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

def task_to_dict(t):
    return {
        'id': t.id,
        'title': t.title,
        'status': t.status,
        'date': t.date,
        'deadline': t.deadline,
        'priority': t.priority or 'medium',
        'subject_id': t.subject_id
    }

@tasks_bp.route('/', methods=['GET'])
@token_required
def get_tasks(current_user):
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.id.desc()).all()
    return jsonify([task_to_dict(t) for t in tasks]), 200

@tasks_bp.route('/', methods=['POST'])
@token_required
def add_task(current_user):
    data = request.json
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Missing title'}), 400

    new_task = Task(
        user_id=current_user.id,
        title=title,
        status=data.get('status', 'pending'),
        date=data.get('date') or datetime.now().strftime('%Y-%m-%d'),
        deadline=data.get('deadline'),
        priority=data.get('priority', 'medium'),
        subject_id=data.get('subject_id')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(task_to_dict(new_task)), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.json
    for field in ('status', 'title', 'deadline', 'priority'):
        if field in data:
            setattr(task, field, data[field])

    db.session.commit()
    return jsonify(task_to_dict(task)), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200
