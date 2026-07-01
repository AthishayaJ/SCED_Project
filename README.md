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

## Railway Deployment

This backend is ready for Railway deployment.

### Required Railway setup
1. Create a new Railway project.
2. Add a service from this repository and set the root to the backend folder.
3. Add a MySQL database service.
4. Set these environment variables in Railway:
   - PORT=5000
   - MYSQL_HOST=your-railway-mysql-host
   - MYSQL_PORT=3306
   - MYSQL_USER=your-railway-mysql-user
   - MYSQL_PASSWORD=your-railway-mysql-password
   - MYSQL_DATABASE=your-railway-database-name
   - JWT_SECRET=your-long-random-secret
   - ALLOWED_ORIGIN=https://your-frontend-domain
   - EMAIL_USER=your-gmail-address@gmail.com
   - EMAIL_PASS=your-gmail-app-password
   - TZ=Asia/Colombo
   - REMINDER_CRON=* * * * *

### Frontend API URL
Set the frontend environment variable:

```bash
VITE_API_URL=https://your-railway-backend-url
```

Then rebuild the frontend.