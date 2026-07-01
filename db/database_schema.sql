CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE todos (
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
);

-- Sample data (optional, safe to remove)
INSERT INTO users (name, email, password)
VALUES ('Riveen', 'riveen@uom.lk', 'hashed_pw_123');

INSERT INTO todos (title, description, type, priority, due_date, event_time, deadline, user_id, user_email, status)
VALUES ('Update Database Schema', 'Sync schema.sql with actual backend tables', 'General', 'High', '2026-04-10', '10:00:00', '2026-04-10 10:00:00', 1, 'riveen@uom.lk', 'upcoming');

SELECT * FROM users;
SELECT * FROM todos;