const express = require('express'); 
const router = express.Router();

const todoController = require('../controllers/todoController');
const { protect } = require('../Middleware/AuthMiddleware'); // 🔐 JWT middleware

// 🔐 Protected Routes

// GET all todos (only for logged-in users)
router.get('/', protect, todoController.getTodos);

// CREATE a new todo (only for logged-in users)
router.post('/', protect, todoController.createTodo);

module.exports = router;
