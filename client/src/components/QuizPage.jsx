import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Keep Link if you use it in other parts of this component, otherwise remove

// Get the API base URL from environment variables, no localhost fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

const QuizPage = ({ user, logout }) => { // Added user and logout props for consistency and robust error handling
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError('');

      // Crucial check: Ensure API_BASE_URL is defined
      if (!API_BASE_URL) {
        console.error("Error: API_BASE_URL is not defined. Please ensure it's set as an environment variable on Vercel.");
        setError("Configuration error: Backend URL not found. Please contact support.");
        setLoading(false);
        return;
      }

      try {
        console.log(`QuizPage: Fetching quizzes from ${API_BASE_URL}/quizzes`);
        const response = await axios.get(
          `${API_BASE_URL}/quizzes`, // Uses the dynamic API_BASE_URL
          {
            withCredentials: true // CRUCIAL: Tells Axios to send the HttpOnly cookie
          }
        );
        setQuizzes(response.data);
      } catch (err) {
        console.error('QuizPage: Error fetching quizzes:', err.response?.data?.message || err.message || err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // If the server says unauthorized, the token might be bad or missing.
          // Force a logout and redirect to login.
          setError('Session expired or unauthorized. Please log in again.');
          // Assuming you pass a logout function from your App.js or context
          if (logout) {
            logout();
          }
          navigate('/login');
        } else {
          setError('Failed to load quizzes. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [logout, navigate]); // Depend on logout and navigate to ensure useEffect runs when they change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
        <p className="text-2xl font-semibold animate-pulse">Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
        <p className="text-red-300 text-2xl bg-red-800/30 p-4 rounded-lg border border-red-500/50">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6 pt-24 md:pt-32">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center text-purple-300 tracking-tight animate-slideInDown">
          Choose Your Quiz Adventure
        </h1>

        {/* Optional: Admin Link if user is admin (added from QuizzesPage example for consistency) */}
        {user && user.role === 'admin' && (
          <div className="text-center mb-8">
            <Link
              to="/admin"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg text-lg"
            >
              Go to Admin Dashboard
            </Link>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-center text-white text-xl md:text-2xl opacity-80 bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-md">
              No quizzes available yet. Sharpen your mind and check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {quizzes.map((quiz, index) => (
              <div
                key={quiz._id}
                className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl
                           transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]
                           flex flex-col justify-between border border-white/20 text-white animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-purple-200 leading-tight">
                    {quiz.title}
                  </h2>
                  <p className="text-gray-300 text-md md:text-lg opacity-90">
                    <span className="font-semibold">{quiz.questions.length}</span> questions
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/quiz/${quiz._id}`)}
                  className="mt-8 bg-purple-600 text-white px-6 py-3 rounded-full text-lg md:text-xl font-bold
                             hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl
                             focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
                >
                  Take Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;