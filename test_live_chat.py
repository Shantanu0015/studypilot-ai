import urllib.request
import json

# 1. Register a test user
register_req = urllib.request.Request(
    'https://studypilot-ai-backend.onrender.com/api/auth/register',
    data=json.dumps({"name": "Test", "email": "testchat@test.com", "password": "password"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(register_req) as response:
        print("Register:", response.read().decode('utf-8'))
except Exception as e:
    print("Register failed, maybe user exists.")

# 2. Login
login_req = urllib.request.Request(
    'https://studypilot-ai-backend.onrender.com/api/auth/login',
    data=json.dumps({"email": "testchat@test.com", "password": "password"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(login_req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        token = res_data.get('token')
        print("Login success, token received.")
except Exception as e:
    print("Login failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
    exit()

# 3. Test Chat
chat_req = urllib.request.Request(
    'https://studypilot-ai-backend.onrender.com/api/ai/chat',
    data=json.dumps({"message": "hello"}).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(chat_req) as response:
        print("Chat Response:", response.read().decode('utf-8'))
except Exception as e:
    print("Chat Error:", e)
    if hasattr(e, 'read'):
        print("Error details:", e.read().decode('utf-8'))
