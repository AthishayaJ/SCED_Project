const cron         = require('node-cron');
const ToDoModel    = require('../Models/TodoModel');
const EmailService = require('./EmailService');

const CRON_EXPRESSION = process.env.REMINDER_CRON || '*/15 * * * *'; // every 15 min
const ONE_MIN_MS      = 60 * 1000;
const WINDOW_HALF_MS  = 7.5 * ONE_MIN_MS;  // ±7.5 min → matches 15-min cron interval

const MAX_RETRY_COUNT = 5;

let isRunning = false;

async function checkReminders(now, targetHours, flagColumn) {
   
    const targetMs    = targetHours * 60 * ONE_MIN_MS;
    const windowStart = new Date(now.getTime() + targetMs - WINDOW_HALF_MS);
    const windowEnd   = new Date(now.getTime() + targetMs + WINDOW_HALF_MS);

    const tasks = await ToDoModel.findTasksDueForReminder(windowStart, windowEnd, flagColumn);

    if (tasks.length === 0) return; 

    console.log(`[ReminderScheduler] ${tasks.length} task(s) need a ${targetHours}h reminder`);

    for (const task of tasks) {
        try {
            await EmailService.sendReminder(task, targetHours);

            await ToDoModel.markReminderSent(task.id, flagColumn);

        } catch (err) {
            console.error(
                `[ReminderScheduler] Failed ${targetHours}h reminder for task #${task.id}:`,
                err
            );

            if (err instanceof TypeError && err.message.includes('email')) {
                console.warn(
                    `[ReminderScheduler] Task #${task.id} has an invalid email address ` +
                    `("${task.user_email}"). Skipping retry counter — fix the address in the DB.`
                );
                await ToDoModel.incrementFailedCount(task.id);
                continue; 
            }

            try {
                await ToDoModel.incrementFailedCount(task.id);
                console.warn(
                    `[ReminderScheduler] Task #${task.id} failure count incremented ` +
                    `(max: ${MAX_RETRY_COUNT}).`
                );
            } catch (dbErr) {
                console.error('[ReminderScheduler] Could not increment failure count:', dbErr);
            }
        }
    }
}

async function checkAndSendReminders() {
    if (isRunning) {
        console.warn(
            '[ReminderScheduler] Previous run still active — skipping this tick. ' +
            'If this happens regularly, consider a persistent job queue (BullMQ/RabbitMQ).'
        );
        return;
    }

    isRunning   = true;
    const now   = new Date();
    const start = Date.now();
    console.log(`[ReminderScheduler] Run started at ${now.toISOString()}`);

    try {
        await checkReminders(new Date(), 24, 'reminder_24_sent');
        await checkReminders(new Date(), 12, 'reminder_12_sent');
        await checkReminders(new Date(),  1, 'reminder_1_sent');

        const elapsed = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`[ReminderScheduler] Run completed in ${elapsed}s`);

    } catch (err) {
        console.error('[ReminderScheduler] Unexpected error during run:', err);
    } finally {
        isRunning = false;
    }
}

function startScheduler() {
    if (!cron.validate(CRON_EXPRESSION)) {
        throw new Error(
            `[ReminderScheduler] Invalid cron expression: "${CRON_EXPRESSION}". ` +
            `Check the REMINDER_CRON environment variable.`
        );
    }

    cron.schedule(CRON_EXPRESSION, checkAndSendReminders, {
        scheduled: true,
        timezone:  process.env.TZ || 'UTC',
    });

    console.log(
        `[ReminderScheduler] Scheduler started ` +
        `(cron: "${CRON_EXPRESSION}", window: ±${WINDOW_HALF_MS / ONE_MIN_MS} min, ` +
        `TZ: ${process.env.TZ || 'UTC'}, max retries: ${MAX_RETRY_COUNT})`
    );
}

module.exports = { startScheduler, checkAndSendReminders };