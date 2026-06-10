const cron = require('node-cron');
const { pool } = require('../config/mysql');
const EmailService = require('./EmailService');

const CRON_EXPRESSION = process.env.REMINDER_CRON || '* * * * *';
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;
const WINDOW_HALF_MS = 2 * ONE_MINUTE_MS;
const MAX_CATCHUP_MS = Number(process.env.REMINDER_MAX_CATCHUP_HOURS || 48) * ONE_HOUR_MS;
const REMINDERS = [
    { leadMs: 24 * ONE_HOUR_MS, field: 'reminder_24_sent', label: '24 hours', explicitKey: '1_day' },
    { leadMs: 12 * ONE_HOUR_MS, field: 'reminder_12_sent', label: '12 hours', explicitKey: '12_hours' },
    { leadMs: 6 * ONE_HOUR_MS, field: 'reminder_6_sent', label: '6 hours', explicitKey: '6_hours' },
    { leadMs: 1 * ONE_HOUR_MS, field: 'reminder_1_sent', label: '1 hour', explicitKey: '1_hour' },
    { leadMs: 30 * ONE_MINUTE_MS, field: 'reminder_30m_sent', label: '30 minutes', explicitKey: '30_minutes' },
    { leadMs: 10 * ONE_MINUTE_MS, field: 'reminder_10m_sent', label: '10 minutes', explicitKey: '10_minutes' },
];
const PRIORITY_RULES = {
    high: new Set(['24 hours', '12 hours', '6 hours', '1 hour', '30 minutes', '10 minutes']),
    medium: new Set(['24 hours', '6 hours', '1 hour', '10 minutes']),
    low: new Set(['24 hours', '6 hours', '10 minutes']),
};

let isRunning = false;

function normalizeReminderValue(value) {
    return String(value || '').trim().toLowerCase();
}

function shouldSendForTask(task, reminder) {
    const explicit = normalizeReminderValue(task.remind_before);
    if (explicit) {
        return explicit === reminder.explicitKey;
    }

    const priority = normalizeReminderValue(task.priority);
    const rules = PRIORITY_RULES[priority] || PRIORITY_RULES.medium;
    return rules.has(reminder.label);
}

async function sendDueReminder(now, reminder) {
    const windowStart = new Date(now.getTime() - MAX_CATCHUP_MS + reminder.leadMs);
    const windowEnd = new Date(now.getTime() + WINDOW_HALF_MS + reminder.leadMs);

    const [tasks] = await pool.query(
        `SELECT * FROM todos
        WHERE status = 'upcoming'
        AND deadline >= ?
        AND deadline <= ?
        AND ${reminder.field} = 0`,
        [windowStart, windowEnd],
    );

    for (const task of tasks) {
        if (!shouldSendForTask(task, reminder)) {
            continue;
        }

        const deadline = new Date(task.deadline);
        const createdAt = new Date(task.created_at);
        const updatedAt = new Date(task.updated_at);
        const reminderTarget = new Date(deadline.getTime() - reminder.leadMs);
        const reminderTargetWithWindow = new Date(reminderTarget.getTime() + WINDOW_HALF_MS);
        const anchorAt = !Number.isNaN(updatedAt.getTime()) ? updatedAt : createdAt;

        // If event was created/edited after this reminder slot passed, skip stale reminders.
        if (!Number.isNaN(anchorAt.getTime()) && anchorAt > reminderTargetWithWindow) {
            continue;
        }

        try {
            await EmailService.sendReminder(task, reminder.label);
            await pool.query(
                `UPDATE todos SET ${reminder.field} = 1 WHERE id = ?`,
                [task.id],
            );
            console.log(`[ReminderScheduler] Sent ${reminder.label} reminder for event ${task.id}`);
        } catch (err) {
            await pool.query(
                'UPDATE todos SET reminder_failed_count = reminder_failed_count + 1 WHERE id = ?',
                [task.id],
            );
            console.error(`[ReminderScheduler] Failed reminder for event ${task.id}:`, err.message);
        }
    }
}

async function checkAndSendReminders() {
    if (isRunning) return;
    isRunning = true;

    try {
        const now = new Date();
        for (const reminder of REMINDERS) {
            await sendDueReminder(now, reminder);
        }
    } finally {
        isRunning = false;
    }
}

function startScheduler() {
    if (!cron.validate(CRON_EXPRESSION)) {
        throw new Error(`Invalid REMINDER_CRON expression: ${CRON_EXPRESSION}`);
    }

    cron.schedule(CRON_EXPRESSION, checkAndSendReminders, {
        scheduled: true,
        timezone: process.env.TZ || 'Asia/Colombo',
    });

    // Run once at startup to catch reminders missed while the server was down.
    checkAndSendReminders().catch((err) => {
        console.error('[ReminderScheduler] Startup reminder check failed:', err.message);
    });

    console.log(`[ReminderScheduler] Started with cron "${CRON_EXPRESSION}"`);
}

module.exports = { startScheduler, checkAndSendReminders };
