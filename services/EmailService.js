const nodemailer = require('nodemailer');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function assertValidEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new TypeError(`[EmailService] Missing email address`);
    }
    if (!EMAIL_REGEX.test(email.trim())) {
        throw new TypeError(`[EmailService] Invalid email address format: "${email}"`);
    }
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

const transporter = createTransporter();

transporter.verify((error) => {
    if (error) {
        console.error('[EmailService] SMTP configuration error:', error); 
    } else {
        console.log('[EmailService] SMTP transporter ready');
    }
});

const DAILY_SEND_LIMIT = parseInt(process.env.DAILY_SEND_LIMIT || '450', 10);
if (isNaN(DAILY_SEND_LIMIT)) throw new Error('[EmailService] Invalid DAILY_SEND_LIMIT in .env');

let dailySendCount = 0;
let dailySendDate  = new Date().toDateString(); 

function checkAndIncrementDailyLimit() {
    const today = new Date().toDateString();

    if (today !== dailySendDate) {
        dailySendCount = 0;
        dailySendDate  = today;
        console.log('[EmailService] Daily send counter reset for new day.');
    }

    if (dailySendCount >= DAILY_SEND_LIMIT) {
        throw new Error(
            `Daily send limit reached (${DAILY_SEND_LIMIT}). ` +
            `Email NOT sent.`
        );
    }

    dailySendCount++;

    if (dailySendCount >= Math.floor(DAILY_SEND_LIMIT * 0.9)) {
        console.warn(
            `⚠️  Warning: (${dailySendCount}/${DAILY_SEND_LIMIT}) ` +
            `(90% of limit).`
        );
    }
}

function priorityBadge(priority) {
    const styles = {
        high:   'background:#e74c3c;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;',
        medium: 'background:#f39c12;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;',
        low:    'background:#27ae60;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;',
    };
    const validPriority = ['high', 'medium', 'low'].includes(priority) ? priority : 'low';
    const label = validPriority.charAt(0).toUpperCase() + validPriority.slice(1);
    return `<span style="${styles[validPriority]}">${label}</span>`;
}

function formatDeadline(dt) {
    if (!dt) return 'No deadline set';
    return new Date(dt).toLocaleString('en-US', {
        timeZone:     process.env.TZ || 'Asia/Colombo',
        weekday:      'short',
        year:         'numeric',
        month:        'short',
        day:          'numeric',
        hour:         '2-digit',
        minute:       '2-digit',
        timeZoneName: 'short', 
    });
}

function getUrgencyColor(hoursLeft) {
    if (hoursLeft <= 1)  return '#c0392b';
    if (hoursLeft <= 12) return '#e74c3c';
    if (hoursLeft <= 24) return '#f39c12';
    return '#3498db';
}

const EmailService = {
   
    async sendTaskNotification(task) {
        assertValidEmail(task.user_email);

        checkAndIncrementDailyLimit();

        const subject = `✅ Task Created: "${task.title}"`;

        const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">

            <div style="background:#2c3e50;padding:20px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Smart Campus To-Do</h1>
                <p style="color:#bdc3c7;margin:4px 0 0;">Task Created Successfully</p>
            </div>

            <div style="padding:24px;">
                <h2 style="color:#2c3e50;margin-top:0;">${task.title}</h2>
                <p style="color:#555;">${task.description || 'No description provided.'}</p>

                <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                    <tr>
                        <td style="padding:8px 0;color:#888;width:120px;">Priority</td>
                        <td style="padding:8px 0;">${priorityBadge(task.priority)}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#888;">Deadline</td>
                        <td style="padding:8px 0;color:#2c3e50;font-weight:bold;">
                            ${formatDeadline(task.deadline)}
                        </td>
                    </tr>
                </table>

                ${task.deadline ? `
                <div style="background:#eaf4fb;border-left:4px solid #3498db;padding:12px 16px;margin-top:20px;border-radius:0 4px 4px 0;">
                    <p style="margin:0;color:#2980b9;font-size:14px;">
                        🔔 You will receive automatic reminders at
                        <strong>24 hours</strong>, <strong>12 hours</strong>,
                        and <strong>1 hour</strong> before your deadline.
                    </p>
                </div>` : ''}
            </div>

            <div style="background:#f8f9fa;padding:12px 24px;text-align:center;border-top:1px solid #ddd;">
                <p style="margin:0;color:#aaa;font-size:12px;">Smart Campus Dashboard — automated notification</p>
            </div>
        </div>`;

        const t = createTransporter();
        await t.sendMail({
            from:    `"Smart Campus" <${process.env.EMAIL_USER}>`,
            to:      task.user_email,
            subject,
            html,
        });

        console.log(`[EmailService] Task notification sent → ${task.user_email} (task #${task.id}) | Daily count: ${dailySendCount}/${DAILY_SEND_LIMIT}`);
    },

    
    async sendReminder(task, hoursLeft) {
        assertValidEmail(task.user_email);

        checkAndIncrementDailyLimit();

        const color   = getUrgencyColor(hoursLeft);
        const hourStr = `${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}`;
        const subject = `⏰ Reminder: "${task.title}" is due in ${hourStr}`;

        const urgentBanner = hoursLeft <= 1
            ? `<div style="background:#c0392b;color:#fff;text-align:center;padding:10px;font-size:13px;font-weight:bold;letter-spacing:0.5px;">
                   🚨 FINAL REMINDER — Task due in less than 1 hour!
               </div>`
            : '';

        const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">

            ${urgentBanner}

            <div style="background:${color};padding:20px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">⏰ Deadline Reminder</h1>
                <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">
                    Your task is due in <strong>${hourStr}</strong>
                </p>
            </div>

            <div style="padding:24px;">
                <h2 style="color:#2c3e50;margin-top:0;">${task.title}</h2>
                <p style="color:#555;">${task.description || 'No description provided.'}</p>

                <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                    <tr>
                        <td style="padding:8px 0;color:#888;width:120px;">Priority</td>
                        <td style="padding:8px 0;">${priorityBadge(task.priority)}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;color:#888;">Deadline</td>
                        <td style="padding:8px 0;color:${color};font-weight:bold;">
                            ${formatDeadline(task.deadline)}
                        </td>
                    </tr>
                </table>

                <div style="background:#fdf2f2;border-left:4px solid ${color};padding:12px 16px;margin-top:20px;border-radius:0 4px 4px 0;">
                    <p style="margin:0;color:${color};font-size:14px;">
                        🚨 Only <strong>${hourStr}</strong> remaining —
                        make sure to complete this task on time!
                    </p>
                </div>
            </div>

            <div style="background:#f8f9fa;padding:12px 24px;text-align:center;border-top:1px solid #ddd;">
                <p style="margin:0;color:#aaa;font-size:12px;">Smart Campus Dashboard — automated reminder</p>
            </div>
        </div>`;

        const t = createTransporter();
        await t.sendMail({
            from:    `"Smart Campus" <${process.env.EMAIL_USER}>`,
            to:      task.user_email,
            subject,
            html,
        });

        console.log(`[EmailService] ${hourStr} reminder sent → ${task.user_email} (task #${task.id}) | Daily count: ${dailySendCount}/${DAILY_SEND_LIMIT}`);
    },

    
    getDailySendStats() {
        return {
            count: dailySendCount,
            limit: DAILY_SEND_LIMIT,
            date:  dailySendDate,
        };
    },
};

module.exports = EmailService;