from flask import Blueprint, request, jsonify
from extensions import db
from models import User, Task, StudyLog, StudyPlan, Exam, RevisionTopic, SubjectNote, Subject
import os
import jwt
import datetime
from functools import wraps
from dotenv import load_dotenv

# Load .env explicitly from backend folder
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

admin_bp = Blueprint('admin', __name__)

def get_secret():
    return os.environ.get('SECRET_KEY', 'studypilot_fallback_key')

# ─── ADMIN AUTH MIDDLEWARE ───
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Admin token required'}), 401
        try:
            data = jwt.decode(token, get_secret(), algorithms=['HS256'])
            if not data.get('is_admin'):
                return jsonify({'error': 'Admin access only'}), 403
        except Exception:
            return jsonify({'error': 'Invalid or expired token'}), 401
        return f(*args, **kwargs)
    return decorated

# ─── ADMIN LOGIN ───
@admin_bp.route('/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@studypilot.com').strip()
    admin_pass  = os.environ.get('ADMIN_PASSWORD', 'admin123').strip()

    # Debug log (remove after fixing)
    import sys
    print(f"[ADMIN LOGIN] received: email={repr(email)} pass={repr(password)}", file=sys.stderr)
    print(f"[ADMIN LOGIN] expected: email={repr(admin_email.lower())} pass={repr(admin_pass)}", file=sys.stderr)

    if email != admin_email.lower() or password != admin_pass:
        return jsonify({'error': 'Invalid admin credentials'}), 401

    token = jwt.encode({
        'is_admin': True,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, get_secret(), algorithm='HS256')

    return jsonify({'token': token, 'message': 'Admin login successful'}), 200

# ─── PLATFORM STATS ───
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users      = db.session.query(User).count()
    total_tasks      = db.session.query(Task).count()
    completed_tasks  = db.session.query(Task).filter_by(status='done').count()
    total_logs       = db.session.query(StudyLog).count()
    total_minutes    = db.session.query(db.func.sum(StudyLog.focus_time)).scalar() or 0
    total_plans      = db.session.query(StudyPlan).count()
    total_exams      = db.session.query(Exam).count()
    total_notes      = db.session.query(SubjectNote).count()
    total_revisions  = db.session.query(RevisionTopic).count()

    # New users in last 7 days (by id approximation — no created_at stored)
    # Most active user by tasks
    from sqlalchemy import func
    top_user_row = (db.session.query(User.name, func.count(Task.id).label('cnt'))
                    .join(Task, Task.user_id == User.id)
                    .group_by(User.id)
                    .order_by(func.count(Task.id).desc())
                    .first())

    return jsonify({
        'total_users':     total_users,
        'total_tasks':     total_tasks,
        'completed_tasks': completed_tasks,
        'total_study_hours': round(total_minutes / 60, 1),
        'total_sessions':  total_logs,
        'total_plans':     total_plans,
        'total_exams':     total_exams,
        'total_notes':     total_notes,
        'total_revisions': total_revisions,
        'top_user': top_user_row[0] if top_user_row else 'N/A'
    }), 200

# ─── LIST ALL USERS ───
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = db.session.query(User).all()
    result = []
    for u in users:
        task_count  = db.session.query(Task).filter_by(user_id=u.id).count()
        done_count  = db.session.query(Task).filter_by(user_id=u.id, status='done').count()
        minutes     = db.session.query(db.func.sum(StudyLog.focus_time)).filter_by(user_id=u.id).scalar() or 0
        exams       = db.session.query(Exam).filter_by(user_id=u.id).count()
        notes       = db.session.query(SubjectNote).filter_by(user_id=u.id).count()
        result.append({
            'id':            u.id,
            'name':          u.name,
            'email':         u.email,
            'tasks':         task_count,
            'tasks_done':    done_count,
            'study_hours':   round(minutes / 60, 1),
            'exams':         exams,
            'notes':         notes,
        })
    return jsonify(result), 200

# ─── DELETE USER ───
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Delete all related data
    for model in [Task, StudyLog, StudyPlan, Exam, RevisionTopic, SubjectNote, Subject]:
        db.session.query(model).filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user.name} deleted'}), 200

# ─── RECENT ACTIVITY ───
@admin_bp.route('/activity', methods=['GET'])
@admin_required
def get_activity():
    logs = (db.session.query(StudyLog, User.name)
            .join(User, User.id == StudyLog.user_id)
            .order_by(StudyLog.id.desc())
            .limit(20).all())
    result = [{'user': name, 'date': log.date, 'minutes': log.focus_time, 'subject': log.subject or 'General'} for log, name in logs]
    return jsonify(result), 200
