from flask import Blueprint, request, jsonify
from utils.auth_middleware import token_required
from groq import Groq
import os

ai_bp = Blueprint('ai', __name__)

SYSTEM_PROMPT = """You are StudyBot 🤖, an intelligent AI study assistant built into the AI Study Planner app.

Your job is to help students with:
- Explaining concepts from any subject (Maths, Science, History, English, etc.) clearly and simply
- Creating practice questions and quizzes on any topic
- Building exam preparation strategies
- Summarizing textbook topics in easy words
- Solving homework problems step-by-step
- Giving memory tips and mnemonics
- Creating revision schedules
- Motivating students when they feel overwhelmed

Rules:
- Always be friendly, encouraging, and supportive
- Use simple language — explain like the student is hearing it for the first time
- Use emojis occasionally to make responses feel engaging
- Format answers with bullet points, numbered lists, or headings when helpful
- If a student seems stressed, acknowledge it and encourage them
- Keep answers focused and not too long unless a detailed explanation is needed
- When giving examples, use real-world, relatable examples students can connect with"""

@ai_bp.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    data    = request.json or {}
    message = data.get('message', '').strip()
    history = data.get('history', [])  # list of {role, content}

    if not message:
        return jsonify({'error': 'No message provided'}), 400

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        return jsonify({'error': 'AI service not configured'}), 500

    try:
        client = Groq(api_key=api_key)

        # Build messages — system prompt + last 10 messages for context
        messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
        for msg in history[-10:]:
            if msg.get('role') in ('user', 'assistant') and msg.get('content'):
                messages.append({'role': msg['role'], 'content': msg['content']})
        messages.append({'role': 'user', 'content': message})

        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=messages,
            max_tokens=1024,
            temperature=0.7
        )

        reply = response.choices[0].message.content
        return jsonify({'reply': reply}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
