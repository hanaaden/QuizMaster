// backend/routes/adminRoutes.js
const express = require('express');
const { createQuiz } = require('../controllers/quizController'); // Import the quiz controller
const { protect, authorize } = require('../middleware/authMiddleware'); // Ensure these are imported if used here directly, though server.js already uses them for '/api/admin'

const router = express.Router();

// Define the quiz creation route
// The path here is relative to the base path defined in server.js ('/api/admin')
router.post('/quiz', createQuiz); // This handles POST to /api/admin/quiz

// You would add other admin routes here (e.g., manage users, manage quizzes)
// router.get('/users', getUsers);
// router.delete('/users/:id', deleteUser);


module.exports = router;