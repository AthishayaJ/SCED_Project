const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'smart_campus',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    dateStrings: true,
});

async function initMySQL() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(190) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    const [resetTokenCol] = await pool.query(
        `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_token'`,
    );
    if (!resetTokenCol[0].count) {
        await pool.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL');
        await pool.query('ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL');
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            type VARCHAR(80) DEFAULT 'General',
            priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
            due_date DATE NOT NULL,
            event_time TIME NOT NULL DEFAULT '09:00:00',
            remind_before VARCHAR(20) DEFAULT NULL,
            deadline DATETIME NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            user_email VARCHAR(190) NOT NULL,
            status ENUM('upcoming', 'completed', 'archived') DEFAULT 'upcoming',
            reminder_24_sent BOOLEAN DEFAULT FALSE,
            reminder_12_sent BOOLEAN DEFAULT FALSE,
            reminder_6_sent BOOLEAN DEFAULT FALSE,
            reminder_1_sent BOOLEAN DEFAULT FALSE,
            reminder_30m_sent BOOLEAN DEFAULT FALSE,
            reminder_10m_sent BOOLEAN DEFAULT FALSE,
            reminder_failed_count INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_todos_user_deadline (user_id, deadline),
            INDEX idx_todos_status_deadline (status, deadline),
            CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    const [reminder6Col] = await pool.query(
        `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'todos'
         AND COLUMN_NAME = 'reminder_6_sent'`,
    );
    if (!reminder6Col[0].count) {
        await pool.query('ALTER TABLE todos ADD COLUMN reminder_6_sent BOOLEAN DEFAULT FALSE');
    }

    const [reminder30mCol] = await pool.query(
        `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'todos'
         AND COLUMN_NAME = 'reminder_30m_sent'`,
    );
    if (!reminder30mCol[0].count) {
        await pool.query('ALTER TABLE todos ADD COLUMN reminder_30m_sent BOOLEAN DEFAULT FALSE');
    }

    await pool.query('ALTER TABLE todos MODIFY COLUMN remind_before VARCHAR(20) NULL DEFAULT NULL');
}

module.exports = {
    pool,
    initMySQL,
};
