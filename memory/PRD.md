# Vitalis - Real-Time Biometric Mission Monitoring Platform

## Original Problem Statement
Build a sophisticated, production-ready web platform named "Vitalis" designed to support astronauts on long-duration space missions with real-time biometric monitoring, AI-powered health assistance, and mission control capabilities.

## Latest Update - March 15, 2026
Complete UI redesign + Feature Implementation:
- Fixed camera functionality in Live Monitor
- Added crew member hover animations with full bio data
- Implemented working Settings page with toggles
- Implemented Notifications system with dropdown
- Toast notifications for actions

## Core Requirements
1. **Authentication System**: JWT-based login/registration with role-based access control
2. **Dashboard**: Real-time health metrics display (heart rate, HRV, stress, fatigue, wellness score)
3. **Biometric Monitoring**: Webcam-based facial analysis with simulated health data generation
4. **AI Health Assistant**: GPT-4o powered psychological support chat
5. **Crew Management**: Role-based crew health overview (supervisors only)
6. **Health Analytics**: Historical health data visualization with charts

## User Roles
- **Astronaut (Crew Member)**: Personal health monitoring, AI assistant access (no Crew tab)
- **Supervisor (Mission Controller)**: Full crew overview, team health management (has Crew tab)
- **Medical Officer**: Similar to supervisor with medical focus (has Crew tab)

## Technical Stack
- **Frontend**: React, Tailwind CSS, Recharts (Bar, Line, Pie charts), Lucide Icons
- **Backend**: FastAPI (Python), MongoDB (motor async driver)
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI Integration**: GPT-4o via Emergent LLM Key

---

## What's Been Implemented (March 15, 2026)

### UI Design Features ✅
1. **Header Navigation**
   - VITALIS logo with olive green accent
   - Horizontal tab navigation (Dashboard, Live Monitor, Analytics, Alerts, AI Assistant)
   - Settings, notifications, and user avatar with logout

2. **Dashboard Layout**
   - "Mission Monitoring." hero section
   - Top stats cards: Active Sessions, Critical Alerts, Wellness Score
   - Action bar: New Session button, date picker, search
   - Chart cards: Heart Rate, Stress Level, Health Diagnose (donut), User Profile
   - Bottom row: Fatigue Index, Session History, Active Crew list

3. **Live Monitor**
   - Webcam camera feed with dark background
   - Live metrics with colored progress bars
   - Wellness ring chart

4. **AI Assistant**
   - Clean chat interface
   - Quick suggestion buttons
   - GPT-4o powered responses

### Backend Features ✅
- User registration/login with JWT
- Biometric data storage and retrieval
- AI chat with context-aware responses
- Health data simulation

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `POST /api/chat/send` - AI chat messages
- `POST /api/biometric/scan` - Store biometric data
- `GET /api/health` - System health check

### Test Credentials
- Astronaut: `commander@vitalis.com` / `test1234`
- Supervisor: `controller@vitalis.com` / `test1234`

---

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Complete UI redesign to match reference design
- [x] Horizontal navigation tabs
- [x] Compact chart cards
- [x] Role-based navigation (Crew hidden for astronauts)

### P1 - High Priority
- [ ] Implement real facial analysis with face-api.js
- [ ] Add data export functionality
- [ ] Implement notification system with alerts

### P2 - Medium Priority
- [ ] Offline-first capability with local storage
- [ ] Self-learning baseline algorithm
- [ ] PDF health report generation

### P3 - Future
- [ ] Multi-language support
- [ ] Dark mode theme toggle
- [ ] Mobile responsive optimization

---

## Architecture

```
/app/
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React application (redesigned)
│   │   ├── index.css      # Tailwind and custom styles
│   │   └── index.js       # React entry point
│   ├── public/
│   │   └── index.html     # HTML template
│   └── .env               # Frontend environment
└── memory/
    └── PRD.md             # This file
```

## Key Technical Notes
- Biometric data is **SIMULATED** locally (not real facial analysis)
- AI chat uses **REAL** GPT-4o API via Emergent LLM Key
- Backend URL: `https://vitalis-mission.preview.emergentagent.com`
- Color scheme: Olive green (#4A5D4A), Purple (#8B5CF6), Beige (#F5F5F0)
