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

## Getting Started

### Backend
cd backend
cp .env.example .env    ← fill in your values
npm install
npm start

### Frontend
cd frontend
npm install
npm run dev

## Environment Variables

See backend/.env.example — needs:
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET
- EMAIL_USER, EMAIL_PASS