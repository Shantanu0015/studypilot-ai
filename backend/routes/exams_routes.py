from flask import Blueprint, request, jsonify
from models import Exam
from extensions import db
from utils.auth_middleware import token_required

exams_bp = Blueprint('exams', __name__)

def exam_to_dict(e):
    return {'id': e.id, 'subject': e.subject, 'exam_date': e.exam_date, 'notes': e.notes or ''}

@exams_bp.route('/', methods=['GET'])
@token_required
def get_exams(current_user):
    exams = Exam.query.filter_by(user_id=current_user.id).order_by(Exam.exam_date).all()
    return jsonify([exam_to_dict(e) for e in exams]), 200

@exams_bp.route('/', methods=['POST'])
@token_required
def add_exam(current_user):
    data = request.json
    if not data.get('subject') or not data.get('exam_date'):
        return jsonify({'error': 'Missing subject or exam_date'}), 400
    e = Exam(user_id=current_user.id, subject=data['subject'],
             exam_date=data['exam_date'], notes=data.get('notes', ''))
    db.session.add(e)
    db.session.commit()
    return jsonify(exam_to_dict(e)), 201

@exams_bp.route('/<int:exam_id>', methods=['DELETE'])
@token_required
def delete_exam(current_user, exam_id):
    e = Exam.query.filter_by(id=exam_id, user_id=current_user.id).first()
    if not e:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(e)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
