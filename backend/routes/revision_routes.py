from flask import Blueprint, request, jsonify
from models import RevisionTopic
from extensions import db
from utils.auth_middleware import token_required

revision_bp = Blueprint('revision', __name__)

def topic_to_dict(t):
    return {'id': t.id, 'subject': t.subject, 'topic': t.topic, 'status': t.status}

@revision_bp.route('/', methods=['GET'])
@token_required
def get_topics(current_user):
    topics = RevisionTopic.query.filter_by(user_id=current_user.id).order_by(RevisionTopic.subject, RevisionTopic.id).all()
    return jsonify([topic_to_dict(t) for t in topics]), 200

@revision_bp.route('/', methods=['POST'])
@token_required
def add_topic(current_user):
    data = request.json
    if not data.get('subject') or not data.get('topic'):
        return jsonify({'error': 'Missing subject or topic'}), 400
    t = RevisionTopic(user_id=current_user.id, subject=data['subject'],
                      topic=data['topic'], status='not_started')
    db.session.add(t)
    db.session.commit()
    return jsonify(topic_to_dict(t)), 201

@revision_bp.route('/<int:topic_id>', methods=['PUT'])
@token_required
def update_topic(current_user, topic_id):
    t = RevisionTopic.query.filter_by(id=topic_id, user_id=current_user.id).first()
    if not t:
        return jsonify({'error': 'Not found'}), 404
    if 'status' in request.json:
        t.status = request.json['status']
    db.session.commit()
    return jsonify(topic_to_dict(t)), 200

@revision_bp.route('/<int:topic_id>', methods=['DELETE'])
@token_required
def delete_topic(current_user, topic_id):
    t = RevisionTopic.query.filter_by(id=topic_id, user_id=current_user.id).first()
    if not t:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200
