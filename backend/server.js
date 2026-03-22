require('dotenv').config(); // 🔥 KEEP THIS FIRST

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 🔥 ADD THESE
const { connectDB } = require('./config/sql');
const authRoutes = require('./routes/AuthRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔥 CONNECT MSSQL (for auth)
connectDB();

// Connect to MongoDB (for todos)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_campus';

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 🔥 ADD AUTH ROUTES
app.use('/api/auth', authRoutes);

// Existing todo routes
const todoRoutes = require('./routes/todoRoutes');
app.use('/api/todos', todoRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
