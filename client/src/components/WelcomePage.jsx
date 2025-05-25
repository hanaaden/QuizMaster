import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950
                    text-white p-6 md:p-10 lg:p-16 relative overflow-hidden">

      {/* Optional: Add subtle background elements for more style */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="text-center bg-white/10 backdrop-blur-xl p-8 md:p-12 lg:p-16
                      rounded-3xl shadow-3xl max-w-xl w-full border border-white/20
                      transform transition-all duration-500 hover:scale-105 relative z-10
                      animate-fadeIn"> {/* Added animate-fadeIn here for overall container */}

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4
                       tracking-tight leading-tight animate-slideInDown"> {/* Adjusted font sizes and added tracking/leading */}
          Quizify
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-12 font-light
                      opacity-90 animate-slideInUp"> {/* Adjusted font sizes and opacity */}
          Test Your Knowledge. Sharpen Your Mind.
        </p>

        <div className="space-y-6 sm:space-y-8 animate-fadeInUpBig"> {/* Increased spacing and added a different animation */}
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-400 text-purple-950 font-extrabold py-3 md:py-4 px-10
                       rounded-full text-xl md:text-2xl tracking-wide
                       hover:bg-purple-300 transition-all duration-300
                       transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-75
                       w-full max-w-sm mx-auto shadow-md" // Max width to keep buttons from stretching too wide on large screens
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-indigo-400 text-indigo-950 font-extrabold py-3 md:py-4 px-10
                       rounded-full text-xl md:text-2xl tracking-wide
                       hover:bg-indigo-300 transition-all duration-300
                       transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-75
                       w-full max-w-sm mx-auto shadow-md"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;