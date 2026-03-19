-- Step 1: Prepare the Environment
CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

-- Step 2: Clean up existing tables to avoid "Table already exists" errors
-- We drop them in this specific order because of Foreign Key dependencies
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Step 3: Create the Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create the Events Table (Now includes the 'category' column)
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

-- Step 5: Create the Tasks Table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    task_name VARCHAR(255),
    priority ENUM('High', 'Medium', 'Low'),
    is_done BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 6: Add Sample Data
INSERT INTO users (name, email, password, role) 
VALUES ('Riveen', 'riveen@uom.lk', 'hashed_pw_123', 'student');

INSERT INTO events (title, description, event_date, location, category) 
VALUES ('Tech Expo 2026', 'Showcase of final year projects', '2026-04-10 10:00:00', 'Civil Auditorium', 'Academic');

INSERT INTO tasks (user_id, task_name, priority) 
VALUES (1, 'Update Database Schema', 'High');

-- Step 7: Verify Everything
SELECT * FROM users;
SELECT * FROM events;
SELECT * FROM tasks;
