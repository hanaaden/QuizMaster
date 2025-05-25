
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

// Import Mongoose Models
const User = require('./models/UserModel');
const Quiz = require('./models/QuizModel');
const Result = require('./models/ResultModel');

const app = express();

// --- Middleware Setup ---
// Important: CORS must come BEFORE other middleware like express.json()
// It handles preflight requests which are crucial for cross-origin with credentials
app.use(cors({
    origin: ['https://quiz-master-seven-amber.vercel.app', 'http://localhost:3000'], // Allow your Vercel frontend and local development
    credentials: true, // This is CRUCIAL for sending/receiving cookies across origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
}));
app.use(express.json()); // Parses JSON body payloads
app.use(cookieParser()); // Parses cookies from the request headers

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- JWT Middleware (Authentication) ---
// This middleware now specifically looks for the JWT in the 'token' HttpOnly cookie
const verifyUser = (req, res, next) => {
    // Check for the 'token' cookie
    const token = req.cookies.token;

    if (!token) {
        console.log('No token cookie found.');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret-key', (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err);
            // Clear invalid token cookie to prevent repeated attempts
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
                path: '/'
            });
            return res.status(403).json({ message: 'Unauthorized: Invalid or expired token' });
        }
        req.userId = decoded.userId;
        req.role = decoded.role;
        // Also attach the entire user object if needed for frontend, though not strictly required by your existing code
        // req.user = decoded; // This would store { userId, role }
        console.log(`Token verified for userId: ${req.userId}, role: ${req.role}`);
        next();
    });
};

// --- Admin Middleware (Authorization) ---
const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only access' });
    }
    next();
};

// --- Auth Routes ---
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        const hash = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hash, role: role || 'user' });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'jwt-secret-key', { expiresIn: '1d' });

        // *** MODIFIED: Set JWT as an HttpOnly cookie ***
        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for cross-site cookies with secure: true
            maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds (matches JWT expiration)
            path: '/' // Cookie is available on all paths
        });

        res.status(200).json({
            message: 'Login successful',
            role: user.role,
            userId: user._id,
            username: user.username // Optionally send username for immediate display
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/logout', (req, res) => { // Changed to POST for consistency, though GET works for simple logout
    // *** MODIFIED: Clear the HttpOnly cookie ***
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// --- User/Profile Routes ---
app.get('/me', verifyUser, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            // This case should ideally not happen if verifyUser successfully found a user
            return res.status(404).json({ message: 'User not found in DB after token verification' });
        }

        const results = await Result.find({ userId: req.userId }).populate('quizId', 'title');
        res.status(200).json({ user, results });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// --- Quiz Routes (for users) ---
app.get('/quizzes', verifyUser, async (req, res) => {
    try {
        const quizzes = await Quiz.find({});
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Server error fetching quizzes' });
    }
});

app.get('/quizzes/:id', verifyUser, async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        console.error('Error fetching single quiz:', error);
        res.status(500).json({ message: 'Server error fetching quiz' });
    }
});

app.post('/quiz/:id/submit', verifyUser, async (req, res) => {
    const { answers } = req.body;
    const quizId = req.params.id;
    const userId = req.userId;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (!answers || !Array.isArray(answers) || answers.length !== quiz.questions.length) {
            return res.status(400).json({ message: 'Invalid answers array provided' });
        }

        let score = 0;
        quiz.questions.forEach((q, idx) => {
            const correctOption = q.options.find(opt => opt.isCorrect === true);
            const submittedAnswerIndex = answers[idx];

            if (correctOption && q.options.indexOf(correctOption) === submittedAnswerIndex) {
                score++;
            }
        });

        const result = new Result({
            userId: userId,
            quizId: quiz._id,
            score: score,
            total: quiz.questions.length,
        });
        await result.save();

        res.status(200).json({ message: 'Quiz submitted successfully', score, total: quiz.questions.length });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ message: 'Server error submitting quiz' });
    }
});

// --- Admin Routes --- (These routes already use verifyUser and isAdmin, which is correct now)
app.post('/admin/quiz', verifyUser, isAdmin, async (req, res) => {
    const { title, description, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ message: 'Please enter quiz title and at least one question.' });
    }

    try {
        const newQuiz = new Quiz({
            title,
            description,
            questions,
            createdBy: req.userId,
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json({ message: 'Quiz created successfully!', quiz: savedQuiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A quiz with this title already exists. Please choose a different title.' });
        }
        res.status(500).json({ message: 'Server error during quiz creation.', error: error.message });
    }
});

app.put('/admin/quiz/:id', verifyUser, isAdmin, async (req, res) => {
    const { title, description, questions } = req.body;
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        quiz.title = title !== undefined ? title : quiz.title;
        quiz.description = description !== undefined ? description : quiz.description;

        if (questions && Array.isArray(questions)) {
            const areQuestionsValid = questions.every(q =>
                q.questionText && typeof q.questionText === 'string' && q.questionText.trim() !== '' &&
                Array.isArray(q.options) && q.options.length >= 2 &&
                q.options.every(opt => typeof opt.text === 'string' && opt.text.trim() !== '' && typeof opt.isCorrect === 'boolean') &&
                (q.correctOptionIndex !== undefined && q.correctOptionIndex !== null && q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length)
            );

            if (!areQuestionsValid) {
                return res.status(400).json({ message: 'Invalid questions format provided for update. Each question needs text, at least two non-empty options, and a selected correct answer.' });
            }
            quiz.questions = questions;
        } else if (questions !== undefined) {
            return res.status(400).json({ message: 'Questions must be an array.' });
        }

        const updatedQuiz = await quiz.save();
        res.status(200).json({ message: 'Quiz updated successfully!', quiz: updatedQuiz });
    } catch (error) {
        console.error('Error updating quiz:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error updating quiz.', error: error.message });
    }
});

app.get('/admin/users', verifyUser, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users (admin):', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

app.patch('/admin/user/:id', verifyUser, isAdmin, async (req, res) => {
    const { role } = req.body;
    const userIdToUpdate = req.params.id;

    if (req.userId === userIdToUpdate) {
        return res.status(403).json({ message: "Forbidden: Cannot change your own role via this endpoint." });
    }

    try {
        const user = await User.findById(userIdToUpdate);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role provided. Must be "user" or "admin".' });
        }

        user.role = role;
        await user.save();
        res.status(200).json({ message: 'User role updated successfully', user: user.username, newRole: user.role });
    } catch (error) {
        console.error('Error updating user role (admin):', error);
        res.status(500).json({ message: 'Server error updating user role' });
    }
});

app.delete('/admin/user/:id', verifyUser, isAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;

    if (req.userId === userIdToDelete) {
        return res.status(403).json({ message: "Forbidden: Cannot delete your own account via this endpoint." });
    }

    try {
        const user = await User.findByIdAndDelete(userIdToDelete);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await Result.deleteMany({ userId: userIdToDelete });
        res.status(200).json({ message: 'User and associated results deleted successfully' });
    } catch (error) {
        console.error('Error deleting user (admin):', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

app.delete('/admin/quiz/:id', verifyUser, isAdmin, async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        await Result.deleteMany({ quizId: req.params.id });
        res.status(200).json({ message: 'Quiz and associated results deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz (admin):', error);
        res.status(500).json({ message: 'Server error deleting quiz' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});