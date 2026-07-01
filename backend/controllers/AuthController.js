const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/mysql');
const crypto = require('crypto');
const { sendPasswordReset } = require('../services/EmailService');

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

    if (password.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
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

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const [rows] = await pool.query('SELECT id, name, email FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
        const user = rows[0];

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 30 * 60 * 1000); 

            await pool.query(
                'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
                [token, expires, user.id],
            );

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
            await sendPasswordReset(user, resetLink);
        }

        res.json({ message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and new password are required" });
    if (password.length < 4) return res.status(400).json({ message: "Password must be at least 4 characters" });

    try {
        const [rows] = await pool.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1',
            [token],
        );
        const user = rows[0];
        if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, user.id],
        );

        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
