# SCED Project — Task Management App

A full-stack task management app with JWT authentication and email reminders.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL

## Features

- User Signup / Login (JWT Auth)
- Create, View, Update, Delete Tasks
- Email Reminders via Nodemailer
- Scheduled Reminders using node-cron

## Project Structure

```
SCED_Project/
├── backend/
│   ├── config/         → MySQL connection
│   ├── controllers/    → Auth & Todo logic
│   ├── middleware/     → JWT Auth middleware
│   ├── routes/         → API routes
│   ├── services/       → Email & Reminder scheduler
│   └── server.js       → Entry point
├── frontend/
│   └── src/
│       ├── components/ → Reusable UI components
│       ├── pages/      → Login, Signup, Tasks
│       ├── context/    → App state (Context API)
│       └── services/   → Axios API calls
└── db/
    └── database_schema.sql
```

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env (Copy and Paste the things in env.example and paste it in a new file named as .env)
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
