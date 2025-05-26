const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import Mongoose Models (Ensure these paths are correct relative to server.js)
const User = require('./models/UserModel');
const Quiz = require('./models/QuizModel');
const Result = require('./models/ResultModel');

const app = express();

// --- Middleware Setup ---

// 1. CORS Configuration: Crucial for cross-origin communication
//    - Only include your deployed frontend URLs.
//    - Must come BEFORE other middleware like express.json() for preflight requests.
app.use(cors({
    origin: (origin, callback) => {
        // Define allowed origins
        const allowedOrigins = [
            'https://quiz-master-seven-amber.vercel.app', // REMOVED THE TRAILING SLASH HERE
            'http://localhost:3000', // ADD BACK YOUR LOCAL DEV URL FOR TESTING
            'http://localhost:5173', // ADD BACK YOUR LOCAL VITE DEV URL IF APPLICABLE
        ];

        // Allow requests with no origin (like mobile apps, Postman, or server-to-server requests)
        // or if the origin is in our allowedOrigins list
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error('CORS blocked:', origin); // Log blocked origins for debugging
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // IMPORTANT: Allows sending/receiving cookies across origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers from client
}));
app.use(express.json()); // Parses incoming JSON request bodies
app.use(cookieParser()); // Parses cookies from the request headers (populates req.cookies)

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- JWT Middleware (Authentication) ---
// This middleware verifies the JWT from the 'token' HttpOnly cookie
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        console.log('Authentication: No token cookie found.');
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-key', (err, decoded) => {
        if (err) {
            console.error('Authentication: Token verification failed:', err);
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
        console.log(`Authentication: Token verified for userId: ${req.userId}, role: ${req.role}`);
        next();
    });
};

// --- Admin Middleware (Authorization) ---
const isAdmin = (req, res, next) => {
    if (req.role !== 'admin') {
        console.log(`Authorization: User ${req.userId} (role: ${req.role}) attempted admin access.`);
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
        // Only allow admin registration if ALLOW_ADMIN_REGISTRATION is explicitly true in .env
        const userRole = (role === 'admin' && process.env.ALLOW_ADMIN_REGISTRATION === 'true') ? 'admin' : 'user';
        const user = new User({ username, email, password: hash, role: userRole });
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

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-jwt-secret-key', // Fallback for development, but should be set in .env
            { expiresIn: '1d' }
        );

        // Set the JWT token as an HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' for cross-site requests in production
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/' // Cookie is valid for all paths
        });

        res.status(200).json({
            message: 'Login successful',
            role: user.role,
            userId: user._id,
            username: user.username
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/logout', (req, res) => {
    // Clear the JWT token cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// --- User Profile Route ---
app.get('/me', verifyUser, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password'); // Exclude password from the response
        if (!user) {
            return res.status(404).json({ message: 'User not found in DB after token verification' });
        }
        // Fetch user's quiz results and populate quiz title
        const results = await Result.find({ userId: req.userId }).populate('quizId', 'title');
        res.status(200).json({ user, results });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// --- Quiz Routes (for regular users) ---
app.get('/quizzes', verifyUser, async (req, res) => {
    try {
        const quizzes = await Quiz.find({}); // Fetch all quizzes
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

        // Validate submitted answers array
        if (!answers || !Array.isArray(answers) || answers.length !== quiz.questions.length) {
            return res.status(400).json({ message: 'Invalid answers array provided. Ensure all questions are answered.' });
        }

        let score = 0;
        quiz.questions.forEach((q, idx) => {
            // Find the correct option for the current question
            const correctOption = q.options.find(opt => opt.isCorrect === true);
            const submittedAnswerIndex = answers[idx];

            if (correctOption) {
                const correctOptionIndex = q.options.findIndex(opt => opt.isCorrect === true);
                // Check if the submitted answer index matches the correct option's index
                if (correctOptionIndex !== -1 && correctOptionIndex === submittedAnswerIndex) {
                    score++;
                }
            }
        });

        // Save the quiz result
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

// --- Admin Routes ---
app.post('/admin/quiz', verifyUser, isAdmin, async (req, res) => {
    const { title, description, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Please enter quiz title and at least one question.' });
    }

    // Validate each question and its options
    const areQuestionsValid = questions.every(q =>
        q.questionText && typeof q.questionText === 'string' && q.questionText.trim() !== '' &&
        Array.isArray(q.options) && q.options.length >= 2 && // At least two options
        q.options.some(opt => opt.isCorrect === true) && // At least one correct option
        q.options.every(opt => typeof opt.text === 'string' && opt.text.trim() !== '' && typeof opt.isCorrect === 'boolean')
    );

    if (!areQuestionsValid) {
        return res.status(400).json({ message: 'Invalid questions format. Each question needs text, at least two non-empty options, and at least one correct option.' });
    }

    try {
        const newQuiz = new Quiz({
            title,
            description,
            questions,
            createdBy: req.userId, // Associate quiz with the creating admin
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json({ message: 'Quiz created successfully!', quiz: savedQuiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        // Handle duplicate title error
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

        // Update fields if provided
        if (title !== undefined) quiz.title = title;
        if (description !== undefined) quiz.description = description;

        if (questions && Array.isArray(questions)) {
            const areQuestionsValid = questions.every(q =>
                q.questionText && typeof q.questionText === 'string' && q.questionText.trim() !== '' &&
                Array.isArray(q.options) && q.options.length >= 2 &&
                q.options.some(opt => opt.isCorrect === true) &&
                q.options.every(opt => typeof opt.text === 'string' && opt.text.trim() !== '' && typeof opt.isCorrect === 'boolean')
            );

            if (!areQuestionsValid) {
                return res.status(400).json({ message: 'Invalid questions format provided for update. Each question needs text, at least two non-empty options, and at least one correct answer.' });
            }
            quiz.questions = questions; // Replace all questions with the new array
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
        const users = await User.find({}).select('-password'); // Fetch all users, exclude passwords
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users (admin):', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

app.patch('/admin/user/:id', verifyUser, isAdmin, async (req, res) => {
    const { role } = req.body;
    const userIdToUpdate = req.params.id;

    // Prevent an admin from changing their own role via this endpoint for security
    if (req.userId === userIdToUpdate) {
        return res.status(403).json({ message: "Forbidden: Cannot change your own role via this endpoint." });
    }

    try {
        const user = await User.findById(userIdToUpdate);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate the new role
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

    // Prevent an admin from deleting their own account via this endpoint for security
    if (req.userId === userIdToDelete) {
        return res.status(403).json({ message: "Forbidden: Cannot delete your own account via this endpoint." });
    }

    try {
        const user = await User.findByIdAndDelete(userIdToDelete);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Also delete all results associated with the deleted user
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
        // Also delete all results associated with the deleted quiz
        await Result.deleteMany({ quizId: req.params.id });
        res.status(200).json({ message: 'Quiz and associated results deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz (admin):', error);
        res.status(500).json({ message: 'Server error deleting quiz' });
    }
});

// Catch-all for undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found: The requested endpoint does not exist.' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});