// backend/controllers/quizController.js
const Quiz = require('../models/QuizModel');

// @desc    Create a new quiz
// @route   POST /api/admin/quiz (You'll use /admin/quiz directly in frontend for simplicity)
// @access  Private/Admin
const createQuiz = async (req, res) => {
  const { title, description, questions } = req.body; // Expect title, description, and an array of questions

  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ message: 'Please enter quiz title and at least one question.' });
  }

  try {
    const newQuiz = new Quiz({
      title,
      description,
      questions,
      createdBy: req.user._id, // Assuming req.user is populated by your protect middleware
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json({ message: 'Quiz created successfully!', quiz: savedQuiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Server error during quiz creation.', error: error.message });
  }
};

// You might add more quiz-related functions here (get quizzes, update, delete)

module.exports = {
  createQuiz,
};