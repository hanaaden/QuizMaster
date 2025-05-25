import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:5000/quizzes', { withCredentials: true })
      .then((res) => {
        setQuizzes(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes. Please try again later.');
        setLoading(false);
      });
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6 pt-24 md:pt-32"> {/* Added padding top for fixed navbar */}
      <div className="max-w-6xl mx-auto"> {/* Increased max-width for more quizzes */}
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center text-purple-300 tracking-tight animate-slideInDown">
          Choose Your Quiz Adventure
        </h1>
        {quizzes.length === 0 ? (
          <div className="flex items-center justify-center min-h-[40vh]"> {/* Center text vertically */}
            <p className="text-center text-white text-xl md:text-2xl opacity-80 bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-md">
              No quizzes available yet. Sharpen your mind and check back later!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"> {/* Adjusted responsive grid */}
            {quizzes.map((quiz, index) => (
              <div
                key={quiz._id}
                className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl hover:shadow-2xl
                           transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]
                           flex flex-col justify-between border border-white/20 text-white animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }} // Staggered animation
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