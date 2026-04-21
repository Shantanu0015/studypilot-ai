import requests

# First login to get a token
login = requests.post('http://127.0.0.1:5000/api/auth/login', json={
    'email': 'test@test.com',
    'password': 'test123'
})
print('Login status:', login.status_code)

if login.status_code == 200:
    token = login.json()['token']
    
    # Now test AI suggest
    res = requests.post(
        'http://127.0.0.1:5000/api/ai/suggest',
        json={'subject': 'maths', 'difficulty': 'hard'},
        headers={'Authorization': f'Bearer {token}'}
    )
    print('AI status:', res.status_code)
    print('AI response:', res.text[:500])
else:
    print('Login failed:', login.text)
    print('(Register first or use correct credentials)')
    
    # Test the AI route directly without auth to see the route exists
    res = requests.post(
        'http://127.0.0.1:5000/api/ai/suggest',
        json={'subject': 'maths', 'difficulty': 'hard'}
    )
    print('AI without auth status:', res.status_code)
    print('AI without auth response:', res.text[:200])
