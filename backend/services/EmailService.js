const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertEmailConfig() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be set to send reminder emails");
    }
}

function assertValidEmail(email) {
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        throw new TypeError(`Invalid email address: ${email || ""}`);
    }
}

function createTransporter() {
    assertEmailConfig();
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

async function sendPasswordReset(user, resetLink) {
    assertValidEmail(user.email);

    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"Smart Campus" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset your Smart Campus password',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
                <div style="background:#1d4ed8;padding:20px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:20px;">Password Reset Request</h1>
                </div>
                <div style="padding:24px;">
                    <p>Hi ${user.name || ''},</p>
                    <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
                    <p style="text-align:center;margin:24px 0;">
                        <a href="${resetLink}" style="background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Reset Password</a>
                    </p>
                    <p>If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>`,
    });
}


function formatDeadline(dt) {
    return new Date(dt).toLocaleString('en-US', {
        timeZone: process.env.TZ || 'Asia/Colombo',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

async function sendReminder(task, reminderText) {
    assertValidEmail(task.user_email);

    const leadText = typeof reminderText === 'string' && reminderText.trim()
        ? reminderText.trim()
        : 'upcoming time';
    const subject = `Reminder: "${task.title}" starts in ${leadText}`;
    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
            <div style="background:#1d4ed8;padding:20px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Campus Event Reminder</h1>
                <p style="color:#dbeafe;margin:4px 0 0;">Your event starts in <strong>${leadText}</strong></p>
            </div>
            <div style="padding:24px;">
                <h2 style="color:#1f2937;margin-top:0;">${task.title}</h2>
                <p style="color:#4b5563;">${task.description || 'No description provided.'}</p>
                <p><strong>Category:</strong> ${task.type || 'General'}</p>
                <p><strong>Priority:</strong> ${task.priority || 'Medium'}</p>
                <p><strong>Date and time:</strong> ${formatDeadline(task.deadline)}</p>
            </div>
        </div>`;

    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"Smart Campus" <${process.env.EMAIL_USER}>`,
        to: task.user_email,
        subject,
        html,
    });
}

module.exports = { sendReminder,sendPasswordReset };
