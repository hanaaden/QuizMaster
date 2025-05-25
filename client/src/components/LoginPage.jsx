import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is installed: npm install axios

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

      // --- MODIFIED: Send login credentials to the backend ---
      // Expecting JWT in response body, so no 'withCredentials' needed here.
      const response = await axios.post(
        'https://quizmaster-vhb6.onrender.com/login',
        { email, password }
      );

      console.log("LoginPage: Login successful. Response data:", response.data);

      // Store the token and user info from the response in Local Storage
      // *** This is the critical client-side change ***
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userRole', response.data.role); // Store role
      localStorage.setItem('userId', response.data.userId); // Store userId if needed elsewhere

      // Set the user state directly from the login response if available,
      // or fetch it from /me if /me gives richer user data.
      // For simplicity, let's assume login returns enough for initial state.
      // If your App.jsx's fetchUser is designed to run on mount,
      // you can let it handle the initial user fetching after token storage.
      setUser({ // Assuming response.data contains at least role and userId
        userId: response.data.userId,
        role: response.data.role,
        email: email, // Email might not be in response, but we have it
        // Add other user details if returned by your /login endpoint
      });
      console.log("LoginPage: User state updated with data from login response.");

      // Redirect based on the user's role
      if (response.data.role === 'admin') {
        console.log("LoginPage: Redirecting to /admin as role is admin.");
        navigate('/admin'); // Redirect to admin dashboard
      } else {
        console.log("LoginPage: Redirecting to /quizzes as role is user.");
        navigate('/quizzes'); // Redirect to quizzes listing page
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