import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection on error

// Get the API base URL from environment variables, no localhost fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

const ProfilePage = ({ logout }) => { // Added logout prop for robust error handling
  const [user, setUser] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchProfileData = async () => {
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
        console.log(`ProfilePage: Fetching profile data from ${API_BASE_URL}/me`);
        const response = await axios.get(
          `${API_BASE_URL}/me`, // Uses the dynamic API_BASE_URL
          {
            withCredentials: true // CRUCIAL: Tells Axios to send the HttpOnly cookie
          }
        );
        setUser(response.data.user);
        setResults(response.data.results);
      } catch (err) {
        console.error("ProfilePage: Error fetching profile data:", err.response?.data?.message || err.message || err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          // If the server says unauthorized, the token might be bad or missing.
          // Force a logout and redirect to login.
          setError('Session expired or unauthorized. Please log in again.');
          if (logout) { // Ensure logout function is provided
            logout();
          }
          navigate('/login'); // Redirect to login page
        } else {
          setError('Failed to load profile data. Please try again later.');
        }
        setUser(null);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [logout, navigate]); // Depend on logout and navigate to ensure useEffect runs when they change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
        <p className="text-2xl font-semibold animate-pulse">Loading profile...</p>
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

  // Calculate total score and total out of
  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const totalOutOf = results.reduce((acc, r) => acc + r.total, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6 pt-24 md:pt-32">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl rounded-3xl shadow-3xl border border-white/20 p-8 md:p-10 text-white animate-fadeIn">
        {user ? (
          <>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-purple-300 tracking-tight">
              {user.username}'s Profile
            </h1>

            {/* User Info Card */}
            <div className="mb-8 p-6 rounded-xl bg-white/15 shadow-lg border border-white/20 animate-slideInDown">
              <p className="text-xl md:text-2xl mb-3"><strong>Email:</strong> <span className="font-semibold text-gray-200">{user.email}</span></p>
              <p className="text-xl md:text-2xl"><strong>Role:</strong> <span className={`font-bold ${user.role === 'admin' ? 'text-purple-400' : 'text-blue-300'}`}>{user.role}</span></p>
            </div>

            {/* Quiz Summary Card */}
            <div className="mb-10 p-6 rounded-xl bg-purple-600/30 text-purple-200 font-semibold shadow-lg border border-purple-500/50 animate-fadeIn">
              <p className="text-2xl md:text-3xl text-center mb-2">
                You've completed <strong className="text-purple-100">{results.length}</strong> quizzes.
              </p>
              {results.length > 0 && (
                <p className="text-3xl md:text-4xl text-center mt-3 font-bold">
                  Your total score is{' '}
                  <strong className="text-purple-100">
                    {totalScore} out of {totalOutOf}
                  </strong>.
                </p>
              )}
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-purple-300 text-center">Your Quiz History</h2>
            {results.length === 0 ? (
              <p className="text-gray-300 text-center text-lg bg-white/10 p-4 rounded-lg border border-white/20">You haven't taken any quizzes yet! Time to start quizzing!</p>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={result._id}
                    className="border border-white/20 p-5 rounded-lg bg-white/10 shadow-md text-white animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <p className="text-xl font-semibold mb-2">Quiz: <span className="text-purple-200">{result.quizId?.title || 'Unknown Quiz'}</span></p>
                    <p className="text-lg">Score: <span className="font-bold text-blue-300">{result.score}</span> / {result.total}</p>
                    <p className="text-sm text-gray-400 mt-1">Taken On: {new Date(result.createdAt).toLocaleDateString()} at {new Date(result.createdAt).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-200 text-xl bg-white/10 p-6 rounded-lg border border-white/20">Please log in to see your profile.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;