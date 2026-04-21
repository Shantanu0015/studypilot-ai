from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='pending')
    date = db.Column(db.String(50), nullable=False)
    deadline = db.Column(db.String(50), nullable=True)          # NEW: YYYY-MM-DD
    priority = db.Column(db.String(20), default='medium')       # NEW: high/medium/low

class StudyLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    focus_time = db.Column(db.Integer, default=0)               # minutes
    subject = db.Column(db.String(100), nullable=True)          # NEW: per-subject tracking

class StudyPlan(db.Model):                                       # NEW
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    plan_data = db.Column(db.Text, nullable=False)              # JSON string
    created_at = db.Column(db.String(50), nullable=False)

class UserGoal(db.Model):                                        # NEW
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    weekly_hours_goal = db.Column(db.Float, default=10.0)

class Exam(db.Model):                                            # NEW
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    exam_date = db.Column(db.String(50), nullable=False)        # YYYY-MM-DD
    notes = db.Column(db.Text, nullable=True)

class RevisionTopic(db.Model):                                   # NEW
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    topic = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), default='not_started')    # not_started/reviewing/done

class SubjectNote(db.Model):                                     # NEW
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.String(50), nullable=True)
