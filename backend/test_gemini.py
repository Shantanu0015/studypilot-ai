from dotenv import load_dotenv
load_dotenv()
import os
from groq import Groq

api_key = os.environ.get('GROQ_API_KEY')
client = Groq(api_key=api_key)

completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Say hello in one word"}],
    max_tokens=10,
)
print('SUCCESS:', completion.choices[0].message.content)
