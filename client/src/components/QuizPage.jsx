import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is imported
import { useNavigate } from 'react-router-dom';

const QuizPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                // The global interceptor will add the Authorization header
                const res = await axios.get('https://quizmaster-vhb6.onrender.com/quizzes'); // Removed { withCredentials: true }
                setQuizzes(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching quizzes:', err.response?.data?.message || err.message);
                setError('Failed to load quizzes. Please try again later.');
                setLoading(false);
                // Clear token if unauthorized, prompting re-login
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('username');
                    // Optionally, navigate to login if not already redirected by ProtectedRoute
                    navigate('/login');
                }
            }
        };

        fetchQuizzes();
    }, [navigate]); // Add navigate to dependency array as it's used inside useEffect

    const handleTakeQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
                <p className="text-2xl font-semibold">Loading quizzes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700">
                <p className="text-2xl font-semibold">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-5xl font-extrabold text-center mb-12 text-white tracking-tight">
                    Available <span className="text-purple-300">Quizzes</span>
                </h2>

                {quizzes.length === 0 ? (
                    <p className="text-center text-xl text-gray-300">No quizzes available at the moment. Check back later!</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {quizzes.map((quiz) => (
                            <div
                                key={quiz._id}
                                className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-3xl border border-white/20
                                           transform transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-glow cursor-pointer"
                                onClick={() => handleTakeQuiz(quiz._id)}
                            >
                                <h3 className="text-3xl font-bold mb-4 text-purple-300">{quiz.title}</h3>
                                <p className="text-gray-200 mb-4 text-lg">{quiz.description}</p>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-white flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>
                                        {quiz.questions.length} Questions
                                    </span>
                                    <button
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full
                                                   transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card onClick from firing
                                            handleTakeQuiz(quiz._id);
                                        }}
                                    >
                                        Start Quiz
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;