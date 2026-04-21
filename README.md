# 📚 StudyPilot AI

> A full-stack, production-grade AI-powered study productivity application built with **Flask + SQLite** (backend) and **Vanilla JS** (frontend). Designed to help students plan, focus, track, and learn — all in one place.

![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.8+-green) ![Flask](https://img.shields.io/badge/flask-3.x-orange) ![AI](https://img.shields.io/badge/AI-Groq%20Llama%203.3-purple) ![Mobile](https://img.shields.io/badge/mobile-friendly-brightgreen)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **StudyBot AI Chat** | 24/7 AI tutor powered by Groq Llama 3.3 — explains concepts, creates quizzes, builds plans |
| 🗓 **AI Schedule Generator** | Distribute study time across subjects automatically by difficulty |
| ✅ **Task Manager** | Tasks with deadlines, priorities (High/Medium/Low), and overdue alerts |
| ⏱ **Pomodoro Timer** | Focus sessions with browser notifications + Space bar shortcut |
| 🔥 **Study Streak** | Daily streak counter + 7-day activity habit grid |
| 📊 **Analytics Dashboard** | Focus trend chart, per-subject doughnut chart, weekly goal progress |
| 🎓 **Exam Countdown** | Track upcoming exams with urgency color indicators |
| 📖 **Revision Tracker** | Topic-level status (Not Started → Reviewing → Done ✅) |
| 📝 **Subject Notes** | Per-subject notes with Ctrl+S auto-save |
| 💾 **Save & Recall Plans** | Save generated schedules and reload them anytime |
| 📄 **PDF Export** | Export your study plan as a printable PDF |
| 👤 **Profile / Settings** | Update name, email, and password |
| 🎉 **Onboarding Guide** | Welcome walkthrough for new users |
| 📱 **Mobile Friendly** | Responsive design with bottom nav, slide-in sidebar, full-screen AI chat |
| 🛡️ **Admin Dashboard** | Separate admin panel to monitor users, activity, and platform stats |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Git
- A free [Groq API key](https://console.groq.com) (for AI chat)

### One-Click Launch (Windows)
```
Double-click start.bat
```
This will automatically:
1. Start the Flask backend on `http://127.0.0.1:5000`
2. Start the frontend server on `http://127.0.0.1:8000`
3. Open the browser

### Manual Setup

**1. Clone the repo**
```bash
git clone https://github.com/Shantanu0015/studypilot-ai.git
cd studypilot-ai
```

**2. Set up backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

**3. Configure environment**

Edit `backend/.env`:
```
GROQ_API_KEY=your_groq_key_here
ADMIN_EMAIL=your_email@gmail.com
ADMIN_PASSWORD="your_password"
SECRET_KEY=your_secret_key
```

**4. Start backend**
```bash
python app.py
```

**5. Serve frontend** (in a new terminal)
```bash
cd frontend
python -m http.server 8000
```

**6. Open** `http://127.0.0.1:8000`

---

## 🗂 Project Structure

```
studypilot-ai/
├── backend/
│   ├── app.py                  # Flask app factory + DB migration
│   ├── models.py               # SQLAlchemy models (User, Task, Exam, etc.)
│   ├── extensions.py           # DB instance
│   ├── requirements.txt
│   ├── .env                    # API keys & admin credentials (not committed)
│   └── routes/
│       ├── auth_routes.py      # Register, Login, Profile
│       ├── admin_routes.py     # Admin login, stats, user management
│       ├── ai_routes.py        # StudyBot AI Chat (Groq)
│       ├── planner_routes.py   # AI Schedule generation
│       ├── tasks_routes.py     # Task CRUD with deadline/priority
│       ├── analytics_routes.py # Stats, streak, subject breakdown
│       ├── plans_routes.py     # Save/load study plans
│       ├── goals_routes.py     # Weekly hour goals
│       ├── exams_routes.py     # Exam countdown
│       ├── revision_routes.py  # Topic revision status
│       └── notes_routes.py     # Subject notes
│
├── frontend/
│   ├── index.html              # Main student app (mobile-friendly)
│   ├── admin.html              # Admin dashboard (separate page)
│   ├── css/
│   │   └── style.css           # Full design system + mobile CSS
│   └── js/
│       ├── api.js              # API helper + JWT token management
│       ├── app.js              # All page logic + AI chat + mobile nav
│       ├── pomodoro.js         # Pomodoro timer logic
│       └── antigravity.js      # Premium animations
│
├── start.bat                   # One-click launcher (Windows)
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.8+, Flask 3.x, SQLAlchemy, SQLite |
| AI | Groq API — Llama 3.3 70B Versatile |
| Auth | JWT (PyJWT), Werkzeug password hashing |
| Frontend | HTML5, Vanilla JavaScript, Tailwind CSS |
| Charts | Chart.js |
| Animations | Custom CSS + JS (Antigravity theme) |
| Notifications | Browser Push API |

---

## 📖 API Reference

### Student API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT token |
| GET/PUT | `/api/auth/profile` | View/update profile + password |
| POST | `/api/ai/chat` | StudyBot AI chat |
| POST | `/api/planner/generate-plan` | Generate AI schedule |
| GET/POST | `/api/tasks/` | List/create tasks |
| PUT/DELETE | `/api/tasks/<id>` | Update/delete task |
| GET | `/api/analytics/stats` | Study stats + streak + subject breakdown |
| POST | `/api/analytics/log` | Log focus session |
| GET/POST | `/api/plans/` | Save/load study plans |
| DELETE | `/api/plans/<id>` | Delete saved plan |
| GET/POST | `/api/goals/` | Weekly goal |
| GET/POST/DELETE | `/api/exams/` | Exam entries |
| GET/POST/PUT/DELETE | `/api/revision/` | Revision topics |
| GET/POST/DELETE | `/api/notes/` | Subject notes |

### Admin API
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Admin login (separate credentials) |
| GET | `/api/admin/stats` | Platform-wide statistics |
| GET | `/api/admin/users` | List all users with activity data |
| DELETE | `/api/admin/users/<id>` | Delete user and all their data |
| GET | `/api/admin/activity` | Recent study sessions across all users |

---

## 🛡️ Admin Dashboard

Access the admin panel at `http://127.0.0.1:8000/admin.html`

Or click the **"Admin Dashboard"** link at the bottom of the main login page.

Features:
- 📊 Platform stats — total users, study hours, tasks, exams, notes
- 👥 User management table with completion rates
- 🗑️ Delete users and all their data
- ⚡ Real-time activity feed (last 20 sessions)
- 🔄 Auto-refresh every 60 seconds

---

## 🤖 StudyBot AI — What it can do

Students can ask StudyBot anything:
- *"Explain Newton's 3rd law in simple words"*
- *"Give me 5 practice questions on Quadratic Equations"*
- *"Create a 3-day study plan for my Physics exam"*
- *"Summarize the water cycle in 5 bullet points"*
- *"Give me tips to study better at night"*

The AI keeps the last 10 messages for context — making it feel like a real conversation.

---

## 📱 Mobile Support

- **Top bar** with hamburger menu and AI chat button
- **Bottom navigation** for quick access (Home, Tasks, Focus, Stats, More)
- **Slide-in sidebar** with all pages accessible
- **Full-screen AI chat** on mobile
- **Responsive grids** — all layouts work on small screens

---

## 🔒 Security Notes

> For production deployment:
> - Set all values in `.env` (already excluded from git via `.gitignore`)
> - Use a strong `SECRET_KEY`
> - Use HTTPS
> - Replace SQLite with PostgreSQL for high traffic
> - Change default admin credentials before deploying

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

Made with ❤️ by Shantanu
