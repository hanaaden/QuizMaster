// backend/models/QuizModel.js
const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [optionSchema], // Array of optionSchema
    validate: {
      validator: function(v) {
        return v && v.length > 0; // Ensure at least one option
      },
      message: 'A question must have at least one option!'
    },
  },
  correctOptionIndex: { // Stores the index of the correct option in the options array
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        // Ensure the index is within the bounds of the options array
        return this.options && v < this.options.length;
      },
      message: 'Correct option index is out of bounds!'
    },
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    questions: {
      type: [questionSchema], // Array of questionSchema
      validate: {
        validator: function(v) {
          return v && v.length > 0; // Ensure at least one question
        },
        message: 'A quiz must have at least one question!'
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model('Quiz', quizSchema);