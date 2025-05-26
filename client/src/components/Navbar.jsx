import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Get the API base URL from environment variables, no localhost fallback
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// Configure axios to always send the Authorization header if a token exists
// IMPORTANT: With HttpOnly cookies, the browser automatically sends the cookie.
// Storing authToken in localStorage and setting it in headers might be redundant or conflicting
// if your backend relies *only* on the HttpOnly cookie.
// If your backend relies on the Bearer token in headers, ensure your login response
// returns an authToken in the body, and you store it, then use this interceptor.
// If your backend relies solely on HttpOnly cookies, this interceptor might not be needed for auth.
// Let's assume for now your backend supports both or you intend to use Bearer tokens.
axios.interceptors.request.use(
    config => {
        // This is primarily for stateless APIs or if the token is explicitly
        // passed in headers. For HttpOnly cookies, the browser handles it.
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false); // State for mobile menu visibility

    const handleLogout = async () => {
        try {
            // Use the dynamic API_BASE_URL for the logout endpoint
            await axios.post(
                `${API_BASE_URL}/logout`,
                {}, // Send an empty object for POST request body if no data is needed
                { withCredentials: true } // Crucial: Tells Axios to send the HttpOnly cookie for logout
            );

            // Clear all user-related data from Local Storage
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('username'); // Clear username if stored
            localStorage.removeItem('authToken'); // Clear auth token if you were storing it there

            setUser(null); // Clear user state in App.js
            navigate('/login'); // Redirect to login page after logout
            console.log("Logged out successfully.");
        } catch (error) {
            console.error('Logout failed:', error.response?.data || error.message);
            alert('Logout failed. Please try again. (Client-side session cleared)');
            // Even if logout fails on server (e.g., network error), clear client state
            // to prevent a stale login state and ensure the user is logged out visually.
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('authToken');
            setUser(null);
            navigate('/login');
        }
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <nav className="bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white shadow-lg fixed w-full top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                {/* Brand/Logo link */}
                <Link to={isAuthenticated ? "/quizzes" : "/"} className="text-3xl font-extrabold tracking-wide hover:text-purple-200 transition-colors duration-300">
                    QuizMaster
                </Link>

                {/* Hamburger icon for mobile */}
                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-md">
                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Desktop menu - hidden on mobile */}
                <div className="hidden md:flex space-x-6 items-center">
                    {isAuthenticated ? (
                        <>
                            <Link to="/quizzes" className="text-lg font-medium hover:text-purple-200 transition-colors duration-300">Take Quiz</Link>
                            <Link to="/profile" className="text-lg font-medium hover:text-purple-200 transition-colors duration-300">Profile</Link>
                            {isAdmin && (
                                <Link to="/admin" className="text-lg font-medium hover:text-purple-200 transition-colors duration-300">Admin Dashboard</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-lg font-medium hover:text-purple-200 transition-colors duration-300">Login</Link>
                            <Link to="/signup" className="text-lg font-medium hover:text-purple-200 transition-colors duration-300">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile menu - toggles based on isOpen state */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-indigo-900 pb-4 absolute w-full left-0 transition-all duration-300 ease-in-out ${isOpen ? 'top-full opacity-100' : 'top-[calc(-100%-64px)] opacity-0'}`}>
                <div className="px-2 pt-2 pb-3 space-y-2 flex flex-col items-center">
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/quizzes"
                                className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Take Quiz
                            </Link>
                            <Link
                                to="/profile"
                                className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Profile
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                            <button
                                onClick={() => { handleLogout(); setIsOpen(false); }}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-300 w-full shadow-md"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;