import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Ensure axios is imported

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // The global interceptor will add the Authorization header
                const res = await axios.get('https://quizmaster-vhb6.onrender.com/me'); // Removed { withCredentials: true }
                setUser(res.data.user);
                setResults(res.data.results);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile data:", err.response?.data?.message || err.message);
                setError('Failed to load profile data. Please log in.');
                setLoading(false);
                // Clear token if unauthorized, prompting re-login
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('username');
                }
                setUser(null); // Reset user state
                setResults([]); // Reset results
            }
        };

        fetchProfileData();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-xl font-semibold">Loading profile...</p></div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700"><p className="text-xl font-semibold">{error}</p></div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-xl font-semibold">No user data available. Please log in.</p></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-3xl border border-white/20">
                <h2 className="text-4xl font-extrabold text-center mb-10 text-white tracking-tight">
                    Welcome, <span className="text-purple-300">{user.username || user.email}</span>!
                </h2>

                <div className="space-y-6 mb-12">
                    <div className="bg-white/15 p-6 rounded-lg flex items-center shadow-lg">
                        <svg className="w-8 h-8 text-purple-300 mr-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                        <div>
                            <p className="text-sm text-gray-300">User ID</p>
                            <p className="text-xl font-bold">{user.userId}</p>
                        </div>
                    </div>
                    <div className="bg-white/15 p-6 rounded-lg flex items-center shadow-lg">
                        <svg className="w-8 h-8 text-purple-300 mr-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path></svg>
                        <div>
                            <p className="text-sm text-gray-300">Email</p>
                            <p className="text-xl font-bold">{user.email}</p>
                        </div>
                    </div>
                    <div className="bg-white/15 p-6 rounded-lg flex items-center shadow-lg">
                        <svg className="w-8 h-8 text-purple-300 mr-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                        <div>
                            <p className="text-sm text-gray-300">Role</p>
                            <p className="text-xl font-bold capitalize">{user.role}</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-3xl font-bold text-center mb-8 text-purple-300">Your Quiz History</h3>
                {results.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white/15 rounded-lg overflow-hidden shadow-xl">
                            <thead className="bg-purple-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Quiz</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Score</th>
                                    <th className="py-3 px-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {results.map((result) => (
                                    <tr key={result._id} className="hover:bg-white/20 transition-colors duration-200">
                                        <td className="py-4 px-4 text-lg">{result.quizTitle}</td>
                                        <td className="py-4 px-4 text-lg font-bold">{result.score}%</td>
                                        <td className="py-4 px-4 text-lg">{new Date(result.dateTaken).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-300 text-lg">No quiz results found yet.</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;