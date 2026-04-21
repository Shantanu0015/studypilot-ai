from flask import Blueprint, request, jsonify
from models import SubjectNote
from extensions import db
from utils.auth_middleware import token_required
from datetime import datetime

notes_bp = Blueprint('notes', __name__)

def note_to_dict(n):
    return {'id': n.id, 'subject': n.subject, 'content': n.content, 'updated_at': n.updated_at}

@notes_bp.route('/', methods=['GET'])
@token_required
def get_notes(current_user):
    notes = SubjectNote.query.filter_by(user_id=current_user.id).order_by(SubjectNote.subject).all()
    return jsonify([note_to_dict(n) for n in notes]), 200

@notes_bp.route('/', methods=['POST'])
@token_required
def add_note(current_user):
    data = request.json
    if not data.get('subject') or not data.get('content'):
        return jsonify({'error': 'Missing subject or content'}), 400
    now = datetime.now().strftime('%Y-%m-%d %H:%M')
    # One note per subject per user — upsert
    note = SubjectNote.query.filter_by(user_id=current_user.id, subject=data['subject']).first()
    if note:
        note.content = data['content']
        note.updated_at = now
    else:
        note = SubjectNote(user_id=current_user.id, subject=data['subject'],
                           content=data['content'], updated_at=now)
        db.session.add(note)
    db.session.commit()
    return jsonify(note_to_dict(note)), 200

@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user, note_id):
    note = SubjectNote.query.filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
