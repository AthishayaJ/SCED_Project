const express = require('express'); 
const router = express.Router();

const todoController = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/', protect, todoController.getTodos);

router.post('/', protect, todoController.createTodo);

router.put('/:id', protect, todoController.updateTodo);

router.delete('/:id', protect, todoController.deleteTodo);

module.exports = router;
