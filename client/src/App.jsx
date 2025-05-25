import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import axios from "axios"; // Import axios

// --- Start of AXIOS GLOBAL CONFIGURATION ---
// This interceptor will run before every axios request.
// It checks for an authToken in localStorage and adds it to the Authorization header.
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Axios Interceptor: Attaching Bearer token to request to ${config.url}`);
        } else {
            console.log(`Axios Interceptor: No authToken found for request to ${config.url}`);
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
// --- End of AXIOS GLOBAL CONFIGURATION ---

// Import your components
import WelcomePage from "./components/WelcomePage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import ProfilePage from "./components/ProfilePage";
import AdminDashboard from "./components/AdminDashboard";
import QuizPage from "./components/QuizPage";
import TakeQuizPage from "./components/TakeQuizPage";
import ResultPage from "./components/ResultPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // useEffect hook to fetch logged-in user data when the component mounts
    useEffect(() => {
        const fetchUser = async () => {
            console.log("App.js: Attempting to fetch user on mount...");
            try {
                // The interceptor configured above will handle adding the token if it exists in localStorage.
                const res = await axios.get("https://quizmaster-vhb6.onrender.com/me");

                console.log("App.js: /me response received:", res.data);
                setUser(res.data.user); // Set the user state with fetched data
            } catch (err) {
                console.error("App.js: Error fetching user in useEffect:", err.response?.data?.message || err.message);
                // If fetching user fails (e.g., 401 Unauthorized due to expired/invalid token),
                // clear local storage and reset user state.
                if (err.response && err.response.status === 401) {
                    console.log("App.js: /me returned 401, clearing local storage.");
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                }
                setUser(null); // Set user to null if fetch fails
            } finally {
                setLoadingUser(false); // Always set loading to false after the fetch attempt
                console.log("App.js: User fetch attempt complete. loadingUser set to false.");
            }
        };
        fetchUser();
    }, []); // Empty dependency array means this effect runs only once on mount

    // Show a loading indicator while user data is being fetched
    if (loadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl font-semibold">Loading user data...</p>
            </div>
        );
    }

    return (
        // BrowserRouter provides the routing context to all its children
        <Router>
            {/* Navbar component is rendered here, outside the Routes */}
            {/* This ensures the Navbar appears on all pages. */}
            {/* We pass user and setUser to Navbar so it can conditionally render links and handle logout */}
            <Navbar user={user} setUser={setUser} />

            {/* A div to push content below the fixed/sticky navbar. Adjust pt-16 based on Navbar's height. */}
            <div className="pt-16">
                {/* Routes defines a collection of routes. Only the first matching route is rendered. */}
                <Routes>
                    {/* Public Routes - Accessible to anyone */}
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/login" element={<LoginPage setUser={setUser} />} /> {/* Pass setUser to update global user state after login */}
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Protected User Routes - Only accessible if 'user' is logged in */}
                    {/* Uses ProtectedRoute to encapsulate auth check and redirect logic */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute user={user}>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quizzes" // This route is for the list of quizzes
                        element={
                            <ProtectedRoute user={user}>
                                <QuizPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/quiz/:id" // This route is for taking a specific quiz
                        element={
                            <ProtectedRoute user={user}>
                                <TakeQuizPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/result" // This route is for displaying quiz results
                        element={
                            <ProtectedRoute user={user}>
                                <ResultPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected Admin Route - Only accessible if 'user' is logged in AND has 'admin' role */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute user={user} requiredRole="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* 404 Fallback Route - Catches any unmatched paths and redirects to the WelcomePage */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;