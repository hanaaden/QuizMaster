// src/ResultPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get state passed from TakeQuizPage
  const { score, total, quizTitle } = location.state || {};

  // Define a passing score threshold (e.g., 70%)
  const passingPercentage = 0.70;
  const hasPassed = score / total >= passingPercentage;

  // Handle cases where direct access or missing state occurs
  if (score === undefined || total === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-3xl text-center border border-white/20 text-white max-w-md w-full animate-fadeIn">
          <p className="text-3xl md:text-4xl font-extrabold text-purple-300 mb-6">
            Oops! No quiz results found.
          </p>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            It looks like you landed here by mistake or without completing a quiz.
          </p>
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg md:text-xl font-bold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
          >
            Go to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6 pt-24 md:pt-32">
      <div className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl text-center max-w-md w-full border border-white/20 text-white animate-fadeIn">
        {hasPassed ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-green-300 mb-4 tracking-tight leading-tight">
              Congratulations!
            </h2>
            <p className="text-xl md:text-2xl text-gray-200 mb-2 font-light">
              You passed the <span className="font-semibold text-purple-300">{quizTitle || 'Quiz'}</span>!
            </p>
            <p className="text-4xl font-bold text-purple-400 mb-6 tracking-wide">
              Your Score: {score} / {total}
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Fantastic job! Keep up the great work and take another quiz.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4 animate-shake">😔</div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-red-300 mb-4 tracking-tight leading-tight">
              Better Luck Next Time!
            </h2>
            <p className="text-xl md:text-2xl text-gray-200 mb-2 font-light">
              You completed the <span className="font-semibold text-purple-300">{quizTitle || 'Quiz'}</span>.
            </p>
            <p className="text-4xl font-bold text-purple-400 mb-6 tracking-wide">
              Your Score: {score} / {total}
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Don't worry, every attempt is a step towards improvement. Review and try again!
            </p>
          </>
        )}

        <div className="flex flex-col space-y-4 mt-6">
          <button
            onClick={() => navigate('/quizzes')}
            className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg md:text-xl font-bold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
          >
            Back to Quizzes
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="bg-white/20 text-white px-8 py-3 rounded-full text-lg md:text-xl font-bold hover:bg-white/30 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Go to Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;