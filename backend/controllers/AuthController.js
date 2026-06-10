const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/mysql');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret', {
        expiresIn: '7d'
    });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const [existingRows] = await pool.query(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [normalizedEmail],
        );
        const existingUser = existingRows[0];

        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword],
        );
        const userId = result.insertId;

        res.status(201).json({
            token: generateToken(userId),
            user: {
                id: userId,
                name: name.trim(),
                email: normalizedEmail
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const [rows] = await pool.query(
            'SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1',
            [normalizedEmail],
        );
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            token: generateToken(user.id),
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { registerUser, loginUser };
