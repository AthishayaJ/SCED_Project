const { pool } = require('../config/mysql');

const ALLOWED_REMIND_BEFORE = new Set(['10_minutes', '30_minutes', '1_hour', '6_hours', '12_hours', '1_day']);
const ALLOWED_PRIORITIES = new Set(['high', 'medium', 'low']);

function normalizeRemindBefore(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizePriority(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!ALLOWED_PRIORITIES.has(normalized)) return null;
    if (normalized === 'high') return 'High';
    if (normalized === 'medium') return 'Medium';
    return 'Low';
}

function buildDeadline(dueDate, eventTime = '23:59') {
    const normalizedTime = /^\d{2}:\d{2}$/.test(eventTime) ? eventTime : '23:59';
    const parsed = new Date(`${dueDate}T${normalizedTime}:00`);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const fallback = new Date(dueDate);
    fallback.setHours(23, 59, 0, 0);
    return fallback;
}

function computePriorityFromDeadline(deadline) {
    const diffMs = new Date(deadline).getTime() - Date.now();
    const oneHourMs = 60 * 60 * 1000;
    if (diffMs <= 24 * oneHourMs) return 'High';
    if (diffMs <= 72 * oneHourMs) return 'Medium';
    return 'Low';
}

function toDateString(value) {
    return new Date(value).toISOString().slice(0, 10);
}

function toTimeString(value) {
    return String(value || '09:00:00').slice(0, 5);
}

function serializeTodo(row) {
    const remindBefore = ALLOWED_REMIND_BEFORE.has(row.remind_before)
        ? row.remind_before
        : '';
    return {
        id: String(row.id),
        title: row.title,
        description: row.description || '',
        type: row.type || 'General',
        priority: row.priority || 'Medium',
        dueDate: toDateString(row.due_date),
        eventTime: toTimeString(row.event_time),
        remindBefore,
        status: row.status || 'upcoming',
        user_email: row.user_email,
        createdAt: row.created_at ? toDateString(row.created_at) : undefined,
    };
}

async function getCurrentUser(req) {
    const [rows] = await pool.query(
        'SELECT id, email FROM users WHERE id = ? LIMIT 1',
        [req.user.id],
    );
    const user = rows[0];
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 401;
        throw err;
    }
    return user;
}

exports.getTodos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM todos WHERE user_id = ? ORDER BY deadline ASC',
            [req.user.id],
        );
        res.json(rows.map(serializeTodo));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTodo = async (req, res) => {
    try {
        const user = await getCurrentUser(req);
        const dueDate = req.body.dueDate || req.body.deadline;
        const title = (req.body.title || '').trim();

        if (!title || !dueDate) {
            return res.status(400).json({ message: 'Title and date are required' });
        }

        const eventTime = req.body.eventTime || '09:00';
        const deadline = buildDeadline(dueDate, eventTime);
        const remindBeforeInput = normalizeRemindBefore(req.body.remindBefore);
        const remindBefore = ALLOWED_REMIND_BEFORE.has(remindBeforeInput) ? remindBeforeInput : null;

        const explicitPriority = normalizePriority(req.body.priority);
        const priority = explicitPriority || computePriorityFromDeadline(deadline);

        const payload = {
            title,
            description: req.body.description || '',
            type: req.body.type || 'General',
            priority,
            dueDate,
            eventTime: /^\d{2}:\d{2}$/.test(eventTime) ? `${eventTime}:00` : '09:00:00',
            remindBefore,
            deadline,
            userId: user.id,
            userEmail: user.email,
            status: req.body.status || 'upcoming',
        };

        const [result] = await pool.query(
            `INSERT INTO todos
            (title, description, type, priority, due_date, event_time, remind_before, deadline, user_id, user_email, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.title,
                payload.description,
                payload.type,
                payload.priority,
                payload.dueDate,
                payload.eventTime,
                payload.remindBefore,
                payload.deadline,
                payload.userId,
                payload.userEmail,
                payload.status,
            ],
        );

        const [rows] = await pool.query('SELECT * FROM todos WHERE id = ? LIMIT 1', [result.insertId]);
        res.status(201).json(serializeTodo(rows[0]));
    } catch (err) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

exports.updateTodo = async (req, res) => {
    try {
        const todoId = Number(req.params.id);
        if (!Number.isFinite(todoId)) {
            return res.status(400).json({ message: 'Invalid event id' });
        }

        const [existingRows] = await pool.query(
            'SELECT * FROM todos WHERE id = ? AND user_id = ? LIMIT 1',
            [todoId, req.user.id],
        );
        const existing = existingRows[0];
        if (!existing) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const updates = { ...req.body };
        const nextDueDate = updates.dueDate || existing.due_date;
        const nextEventTime = updates.eventTime || toTimeString(existing.event_time);
        const deadlineChanged = Boolean(updates.dueDate || updates.eventTime);
        const nextDeadline = deadlineChanged ? buildDeadline(nextDueDate, nextEventTime) : existing.deadline;

        const remindBeforeInput = normalizeRemindBefore(updates.remindBefore);
        const hasRemindBeforeUpdate = Object.prototype.hasOwnProperty.call(updates, 'remindBefore');
        let remindBefore = existing.remind_before;
        if (hasRemindBeforeUpdate) {
            if (remindBeforeInput === '') {
                remindBefore = null;
            } else if (ALLOWED_REMIND_BEFORE.has(remindBeforeInput)) {
                remindBefore = remindBeforeInput;
            } else {
                return res.status(400).json({ message: 'Invalid remindBefore value' });
            }
        }

        const hasPriorityUpdate = Object.prototype.hasOwnProperty.call(updates, 'priority');
        const priorityInput = normalizePriority(updates.priority);
        let priority = existing.priority;
        if (hasPriorityUpdate) {
            if (String(updates.priority || '').trim() === '') {
                priority = computePriorityFromDeadline(nextDeadline);
            } else if (priorityInput) {
                priority = priorityInput;
            } else {
                return res.status(400).json({ message: 'Invalid priority value' });
            }
        }

        const merged = {
            title: updates.title ?? existing.title,
            description: updates.description ?? existing.description,
            type: updates.type ?? existing.type,
            priority,
            dueDate: nextDueDate,
            eventTime: /^\d{2}:\d{2}$/.test(nextEventTime) ? `${nextEventTime}:00` : toTimeString(existing.event_time),
            remindBefore,
            status: updates.status ?? existing.status,
            deadline: nextDeadline,
            reminder24: deadlineChanged ? 0 : existing.reminder_24_sent,
            reminder12: deadlineChanged ? 0 : existing.reminder_12_sent,
            reminder6: deadlineChanged ? 0 : existing.reminder_6_sent,
            reminder1: deadlineChanged ? 0 : existing.reminder_1_sent,
            reminder30m: deadlineChanged ? 0 : existing.reminder_30m_sent,
            reminder10m: deadlineChanged ? 0 : existing.reminder_10m_sent,
        };

        await pool.query(
            `UPDATE todos SET
            title = ?, description = ?, type = ?, priority = ?, due_date = ?, event_time = ?, remind_before = ?,
            status = ?, deadline = ?, reminder_24_sent = ?, reminder_12_sent = ?, reminder_6_sent = ?,
            reminder_1_sent = ?, reminder_30m_sent = ?, reminder_10m_sent = ?
            WHERE id = ? AND user_id = ?`,
            [
                merged.title,
                merged.description,
                merged.type,
                merged.priority,
                merged.dueDate,
                merged.eventTime,
                merged.remindBefore,
                merged.status,
                merged.deadline,
                merged.reminder24,
                merged.reminder12,
                merged.reminder6,
                merged.reminder1,
                merged.reminder30m,
                merged.reminder10m,
                todoId,
                req.user.id,
            ],
        );

        const [rows] = await pool.query(
            'SELECT * FROM todos WHERE id = ? AND user_id = ? LIMIT 1',
            [todoId, req.user.id],
        );
        res.json(serializeTodo(rows[0]));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        const todoId = Number(req.params.id);
        if (!Number.isFinite(todoId)) {
            return res.status(400).json({ message: 'Invalid event id' });
        }

        const [result] = await pool.query(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [todoId, req.user.id],
        );
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
