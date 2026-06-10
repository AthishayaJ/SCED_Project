require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/AuthRoutes');
const todoRoutes = require('./routes/todoRoutes');
const { startScheduler } = require('./services/ReminderScheduler');
const { initMySQL } = require('./config/mysql');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await initMySQL();
        console.log('MySQL connected and schema initialized');
        startScheduler();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('MySQL startup error:', err.message);
        process.exit(1);
    }
}

startServer();
