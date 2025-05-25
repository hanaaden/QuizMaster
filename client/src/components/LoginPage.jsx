import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
      console.log("LoginPage: Attempting login for", email);
      // Step 1: Send login credentials to the backend
      // Backend should set an HTTP-only cookie upon successful authentication
      await axios.post(
        'https://quizmaster-vhb6.onrender.com/login',
        { email, password },
        { withCredentials: true } // Crucial for sending and receiving cookies
      );
      console.log("LoginPage: Login successful. Fetching user via /me...");

      // Step 2: After successful login, make another request to /me
      // This is to get the full user object (including role) which is usually not
      // returned by the /login endpoint itself, but is available once authenticated.
      const userRes = await axios.get("https://quizmaster-vhb6.onrender.com/me", { withCredentials: true });
      console.log("LoginPage: /me response after login:", userRes.data);

      // Step 3: Update the global user state in App.jsx
      // This causes App.jsx and Navbar to re-render with the authenticated user data
      setUser(userRes.data.user);
      console.log("LoginPage: setUser called with:", userRes.data.user);

      // Step 4: Redirect based on the user's role obtained from the /me endpoint
      if (userRes.data.user.role === 'admin') {
        console.log("LoginPage: Redirecting to /admin as role is admin.");
        navigate('/admin'); // Redirect to admin dashboard
      } else {
        // For regular users, redirect to the quizzes listing page
        console.log("LoginPage: Redirecting to /quizzes as role is user.");
        navigate('/quizzes'); // Changed from '/quiz' to '/quizzes' for consistency
      }
    } catch (err) {
      console.error("LoginPage: Login error details:", err.response?.data || err.message || err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950
                    p-6 relative overflow-hidden">

      {/* Subtle Background Blobs (Optional, requires tailwind.config.js setup from WelcomePage) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl
                   w-full max-w-md border border-white/20 relative z-10
                   transform transition-all duration-500 hover:scale-[1.02] animate-fadeIn"
      >
        <h2 className="text-4xl font-extrabold mb-8 text-center text-white tracking-tight">
          Login to <span className="text-purple-300">QuizMaster</span>
        </h2>

        {error && (
          <p className="text-red-300 text-center mb-6 p-3 bg-red-800/30 border border-red-500/50 rounded-lg text-sm animate-shake">
            {error}
          </p>
        )}

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
          Login
        </button>

        <p className="mt-8 text-center text-gray-200 text-md">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-300 hover:underline font-semibold transition-colors duration-200">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;