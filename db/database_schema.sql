CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(100),
    category VARCHAR(50), 
    organizer_id INT,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    task_name VARCHAR(255),
    priority ENUM('High', 'Medium', 'Low'),
    is_done BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, password, role) 
VALUES ('Riveen', 'riveen@uom.lk', 'hashed_pw_123', 'student');

INSERT INTO events (title, description, event_date, location, category) 
VALUES ('Tech Expo 2026', 'Showcase of final year projects', '2026-04-10 10:00:00', 'Civil Auditorium', 'Academic');

INSERT INTO tasks (user_id, task_name, priority) 
VALUES (1, 'Update Database Schema', 'High');

SELECT * FROM users;
SELECT * FROM events;
SELECT * FROM tasks;
