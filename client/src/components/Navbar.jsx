import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Ensure axios is imported

const Navbar = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false); // State for mobile menu visibility

    const handleLogout = async () => {
        try {
            // Send a POST request to the logout endpoint.
            // The backend doesn't need credentials for this as it's just a signal to invalidate session/clear token.
            // The frontend's main task here is to clear its local storage.
            await axios.post('https://quizmaster-vhb6.onrender.com/logout');

            // Clear authentication related data from Local Storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('username'); // Clear username as well

            setUser(null); // Clear user state in App.js
            console.log("Logged out successfully.");
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error('Logout failed on server:', error.response?.data || error.message);
            alert('Logout failed on server. Please try again. (Token cleared locally for safety)');
            // Even if the server-side logout fails (e.g., network error),
            // clear client-side state to prevent stale login issues.
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            setUser(null);
            navigate('/login');
        }
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <nav className="bg-gradient-to-r from-purple-800 to-indigo-900 p-4 text-white shadow-lg fixed w-full top-0 z-50"> {/* Increased z-index for fixed nav */}
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
                <div className="hidden md:flex space-x-6 items-center"> {/* Increased space-x */}
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
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-indigo-900 pb-4 absolute w-full left-0 transition-all duration-300 ease-in-out ${isOpen ? 'top-full opacity-100' : 'top-[calc(-100%-64px)] opacity-0'}`}> {/* Adjusted positioning and added transition for smooth open/close */}
                <div className="px-2 pt-2 pb-3 space-y-2 flex flex-col items-center"> {/* Increased space-y */}
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/quizzes"
                                className="block text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-base font-medium w-full text-center transition-colors duration-200"
                                onClick={() => setIsOpen(false)} // Close menu on click
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
                                onClick={() => { handleLogout(); setIsOpen(false); }} // Logout and close menu
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