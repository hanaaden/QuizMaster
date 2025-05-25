import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // Clear previous messages
    try {
      await axios.post('http://localhost:5000/register', {
        username,
        email,
        password,
        role: 'user', // default role for signups
      });
      setSuccess('Account created successfully! Redirecting to login...');
      // redirect to login after signup
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950
                    p-6 relative overflow-hidden">

      {/* Subtle Background Blobs (Optional, requires tailwind.config.js setup) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <form
        onSubmit={handleSignUp}
        className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl
                   w-full max-w-md border border-white/20 relative z-10
                   transform transition-all duration-500 hover:scale-[1.02] animate-fadeIn"
      >
        <h2 className="text-4xl font-extrabold mb-8 text-center text-white tracking-tight">
          Create Your <span className="text-purple-300">Quizify</span> Account
        </h2>

        {error && (
          <p className="text-red-300 text-center mb-6 p-3 bg-red-800/30 border border-red-500/50 rounded-lg text-sm animate-shake">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-300 text-center mb-6 p-3 bg-green-800/30 border border-green-500/50 rounded-lg text-sm animate-fadeIn">
            {success}
          </p>
        )}

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-5 p-3 md:p-4 bg-white/20 text-white placeholder-gray-200
                     rounded-lg border border-white/30 focus:ring-2 focus:ring-purple-300
                     focus:border-purple-300 outline-none transition duration-300 text-lg"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-5 p-3 md:p-4 bg-white/20 text-white placeholder-gray-200
                     rounded-lg border border-white/30 focus:ring-2 focus:ring-purple-300
                     focus:border-purple-300 outline-none transition duration-300 text-lg"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-8 p-3 md:p-4 bg-white/20 text-white placeholder-gray-200
                     rounded-lg border border-white/30 focus:ring-2 focus:ring-purple-300
                     focus:border-purple-300 outline-none transition duration-300 text-lg"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 md:py-4 rounded-lg
                     text-xl font-bold hover:bg-purple-700 transition-colors duration-300
                     focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
                     focus:ring-offset-violet-950 shadow-lg"
        >
          Sign Up
        </button>

        <p className="mt-8 text-center text-gray-200 text-md">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-300 hover:underline font-semibold transition-colors duration-200">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUpPage;