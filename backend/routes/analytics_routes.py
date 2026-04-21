from flask import Blueprint, request, jsonify
from models import Task, StudyLog, Subject
from extensions import db
from utils.auth_middleware import token_required
from sqlalchemy import func
from datetime import date, timedelta

analytics_bp = Blueprint('analytics', __name__)

def _compute_streak(user_id):
    """Count consecutive days (ending today) with at least 1 min focus time."""
    logs = {
        log.date
        for log in StudyLog.query.filter_by(user_id=user_id).all()
        if log.focus_time and log.focus_time > 0
    }
    streak = 0
    day = date.today()
    while str(day) in logs:
        streak += 1
        day -= timedelta(days=1)
    return streak

def _week_grid(user_id):
    """Last 7 days of focus minutes as a list (oldest → newest)."""
    result = []
    for i in range(6, -1, -1):
        d = str(date.today() - timedelta(days=i))
        log = StudyLog.query.filter_by(user_id=user_id, date=d).first()
        result.append({'date': d, 'minutes': log.focus_time if log else 0})
    return result

@analytics_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    uid = current_user.id

    completed_tasks = Task.query.filter_by(user_id=uid, status='completed').count()
    total_tasks     = Task.query.filter_by(user_id=uid).count()

    logs = StudyLog.query.filter_by(user_id=uid).all()
    total_focus  = sum(l.focus_time for l in logs)

    # Weekly focus (last 7 days)
    week_start = str(date.today() - timedelta(days=6))
    weekly_logs = [l for l in logs if l.date >= week_start]
    weekly_focus = sum(l.focus_time for l in weekly_logs)

    # Daily focus chart data
    daily_logs = db.session.query(StudyLog.date, func.sum(StudyLog.focus_time))\
        .filter_by(user_id=uid).group_by(StudyLog.date).all()
    daily_focus = {d: t for d, t in daily_logs}

    # Per-subject breakdown (minutes)
    subj_logs = db.session.query(StudyLog.subject, func.sum(StudyLog.focus_time))\
        .filter(StudyLog.user_id == uid, StudyLog.subject != None)\
        .group_by(StudyLog.subject).all()
    subject_breakdown = [{'subject': s, 'minutes': int(m)} for s, m in subj_logs if s]

    return jsonify({
        'completed_tasks':         completed_tasks,
        'total_tasks':             total_tasks,
        'total_focus_time_minutes': total_focus,
        'weekly_focus_minutes':    weekly_focus,
        'daily_focus':             daily_focus,
        'streak':                  _compute_streak(uid),
        'week_grid':               _week_grid(uid),
        'subject_breakdown':       subject_breakdown,
    }), 200

@analytics_bp.route('/log', methods=['POST'])
@token_required
def log_study(current_user):
    data = request.json
    d   = data.get('date')
    mins = data.get('focus_time')
    subj = data.get('subject')      # optional

    if not d or mins is None:
        return jsonify({'error': 'Missing date or focus_time'}), 400

    # If subject provided, create a separate log entry for that subject
    if subj:
        log = StudyLog.query.filter_by(user_id=current_user.id, date=d, subject=subj).first()
        if log:
            log.focus_time += mins
        else:
            db.session.add(StudyLog(user_id=current_user.id, date=d, focus_time=mins, subject=subj))

    # Always maintain a no-subject daily total entry
    log_total = StudyLog.query.filter_by(user_id=current_user.id, date=d, subject=None).first()
    if log_total:
        log_total.focus_time += mins
    else:
        db.session.add(StudyLog(user_id=current_user.id, date=d, focus_time=mins, subject=None))

    db.session.commit()
    return jsonify({'message': 'Logged', 'streak': _compute_streak(current_user.id)}), 200
