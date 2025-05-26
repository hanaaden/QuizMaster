import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ;
const AdminDashboard = () => {
  const navigate = useNavigate();

  // --- State for Quiz Creation Form ---
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: null,
    },
  ]);

  // --- State for Quiz Editing Form (Modal) ---
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState([]);

  // --- State for displaying existing quizzes and users ---
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);

  // --- General UI State ---
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- Pop-up Confirmation State ---
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupAction, setPopupAction] = useState(null); // Function to execute on confirm
  const [currentItemId, setCurrentItemId] = useState(null); // ID of the item being acted on
  const [currentItemType, setCurrentItemType] = useState(''); // 'quiz', 'user', 'promote', 'demote'
  const [currentRole, setCurrentRole] = useState(''); // Used for user role changes

  // --- Fetch Quizzes and Users on component mount ---
  useEffect(() => {
    const fetchAdminData = async () => {
      // Essential check for API_BASE_URL
      if (!API_BASE_URL) {
        console.error("Error: API_BASE_URL is not defined. Please ensure it's set as an environment variable.");
        setError("Configuration error: Backend URL not found. Please contact support.");
        return;
      }

      try {
        console.log(`AdminDashboard: Fetching quizzes from ${API_BASE_URL}/quizzes`);
        const quizzesRes = await axios.get(`${API_BASE_URL}/quizzes`, { withCredentials: true });
        setQuizzes(quizzesRes.data);

        console.log(`AdminDashboard: Fetching users from ${API_BASE_URL}/admin/users`);
        const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, { withCredentials: true });
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error fetching admin data:', err.response?.data?.message || err.message || err);
        setError(err.response?.data?.message || 'Failed to load admin data.');
        // Optionally redirect if unauthorized access
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/login'); // Or to a specific unauthorized page
        }
      }
    };
    fetchAdminData();
  }, [navigate]); // Add navigate to dependency array

  // --- Pop-up Confirmation Handlers ---
  const triggerConfirm = (message, action, id, type, role = '') => {
    setMessage(''); // Clear any existing success messages
    setError(''); // Clear any existing error messages
    setPopupMessage(message);
    setPopupAction(() => action); // Store the function itself
    setCurrentItemId(id);
    setCurrentItemType(type);
    setCurrentRole(role);
    setShowConfirmPopup(true);
  };

  const handleConfirm = async () => {
    if (popupAction) {
      // Execute the stored action with relevant data
      if (currentItemType === 'quiz') {
        await popupAction(currentItemId);
      } else if (currentItemType === 'user') {
        await popupAction(currentItemId);
      } else if (currentItemType === 'promote' || currentItemType === 'demote') {
        await popupAction(currentItemId, currentRole);
      }
    }
    setShowConfirmPopup(false);
    setPopupAction(null); // Clear the action
    setCurrentItemId(null);
    setCurrentItemType('');
    setCurrentRole('');
  };

  const handleCancel = () => {
    setShowConfirmPopup(false);
    setPopupAction(null);
    setCurrentItemId(null);
    setCurrentItemType('');
    setCurrentRole('');
    setMessage('');
    setError('');
  };

  // --- Quiz Creation Handlers ---
  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: null }]);
  };

  const handleQuestionTextChange = (index, text) => {
    const newQuestions = [...questions];
    newQuestions[index].questionText = text;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, text) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = text;
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctOptionIndex = oIndex;
    setQuestions(newQuestions);
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const formattedQuestions = questions.map((q) => {
      const validOptions = q.options
        .filter(optionText => optionText.trim() !== '')
        .map((optionText, idx) => ({ text: optionText, isCorrect: (q.correctOptionIndex === idx) }));

      return {
        questionText: q.questionText,
        options: validOptions,
        correctOptionIndex: q.correctOptionIndex,
      };
    });

    if (!quizTitle.trim()) {
      setError('Quiz title is required.');
      return;
    }
    if (formattedQuestions.length === 0 || formattedQuestions.some(q => !q.questionText.trim())) {
      setError('Each question must have text.');
      return;
    }
    if (formattedQuestions.some(q => q.options.length < 2 || q.options.some(opt => !opt.text.trim()))) {
      setError('Each question must have at least two non-empty options.');
      return;
    }
    if (formattedQuestions.some(q => q.correctOptionIndex === null || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length)) {
      setError('Please select a correct answer for each question.');
      return;
    }

    try {
      console.log(`AdminDashboard: Creating quiz at ${API_BASE_URL}/admin/quiz`);
      const response = await axios.post(`${API_BASE_URL}/admin/quiz`, {
        title: quizTitle,
        description: quizDescription,
        questions: formattedQuestions,
      }, { withCredentials: true });
      setMessage(response.data.message);

      setQuizTitle('');
      setQuizDescription('');
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctOptionIndex: null }]);

      // Re-fetch quizzes after creation
      console.log(`AdminDashboard: Re-fetching quizzes from ${API_BASE_URL}/quizzes`);
      const quizzesRes = await axios.get(`${API_BASE_URL}/quizzes`, { withCredentials: true });
      setQuizzes(quizzesRes.data);
    } catch (err) {
      console.error('Failed to create quiz:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to create quiz. Check server logs for details.');
    }
  };

  // --- Quiz Management Handlers ---
  const handleDeleteQuiz = async (quizId) => {
    try {
      console.log(`AdminDashboard: Deleting quiz ${quizId} from ${API_BASE_URL}/admin/quiz/${quizId}`);
      await axios.delete(`${API_BASE_URL}/admin/quiz/${quizId}`, { withCredentials: true });
      setMessage('Quiz deleted successfully!');
      setQuizzes(quizzes.filter(q => q._id !== quizId));
    } catch (err) {
      console.error('Error deleting quiz:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to delete quiz.');
    }
  };

  const editQuiz = async (quizId) => {
    try {
      console.log(`AdminDashboard: Fetching quiz ${quizId} for editing from ${API_BASE_URL}/quizzes/${quizId}`);
      const res = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`, { withCredentials: true });
      const quizToEdit = res.data;

      setEditingQuiz(quizToEdit);
      setEditTitle(quizToEdit.title);
      setEditDescription(quizToEdit.description);

      setEditQuestions(quizToEdit.questions.map(q => ({
        questionText: q.questionText,
        options: q.options.map(opt => opt.text),
        correctOptionIndex: q.options.findIndex(opt => opt.isCorrect),
      })));
      setMessage('');
      setError('');
    } catch (err) {
      console.error('Error fetching quiz for editing:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to load quiz for editing.');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuiz(null);
    setError('');
    setMessage('');
  };

  // --- Edit Form Handlers (similar to create, but for editQuestions state) ---
  const handleEditQuestionTextChange = (index, text) => {
    const newQuestions = [...editQuestions];
    newQuestions[index].questionText = text;
    setEditQuestions(newQuestions);
  };

  const handleEditOptionChange = (qIndex, oIndex, text) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].options[oIndex] = text;
    setEditQuestions(newQuestions);
  };

  const handleEditCorrectOptionChange = (qIndex, oIndex) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].correctOptionIndex = oIndex;
    setEditQuestions(newQuestions);
  };

  const handleAddEditOption = (qIndex) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].options.push('');
    setEditQuestions(newQuestions);
  };

  const handleRemoveEditOption = (qIndex, oIndex) => {
    const newQuestions = [...editQuestions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    if (newQuestions[qIndex].correctOptionIndex === oIndex) {
      newQuestions[qIndex].correctOptionIndex = null;
    } else if (newQuestions[qIndex].correctOptionIndex > oIndex) {
      newQuestions[qIndex].correctOptionIndex--;
    }
    setEditQuestions(newQuestions);
  };

  const handleAddEditQuestion = () => {
    setEditQuestions([...editQuestions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: null }]);
  };

  const handleRemoveEditQuestion = (qIndex) => {
    const newQuestions = editQuestions.filter((_, index) => index !== qIndex);
    setEditQuestions(newQuestions);
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!editingQuiz) return;

    const formattedQuestions = editQuestions.map((q) => {
      const validOptions = q.options
        .filter(optionText => optionText.trim() !== '')
        .map((optionText, idx) => ({ text: optionText, isCorrect: (q.correctOptionIndex === idx) }));

      return {
        questionText: q.questionText,
        options: validOptions,
        correctOptionIndex: q.correctOptionIndex,
      };
    });

    if (!editTitle.trim()) {
      setError('Quiz title is required.');
      return;
    }
    if (formattedQuestions.length === 0 || formattedQuestions.some(q => !q.questionText.trim())) {
      setError('Each question must have text.');
      return;
    }
    if (formattedQuestions.some(q => q.options.length < 2 || q.options.some(opt => !opt.text.trim()))) {
      setError('Each question must have at least two non-empty options.');
      return;
    }
    if (formattedQuestions.some(q => q.correctOptionIndex === null || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length)) {
      setError('Please select a correct answer for each question.');
      return;
    }

    try {
      console.log(`AdminDashboard: Updating quiz ${editingQuiz._id} at ${API_BASE_URL}/admin/quiz/${editingQuiz._id}`);
      const response = await axios.put(`${API_BASE_URL}/admin/quiz/${editingQuiz._id}`, {
        title: editTitle,
        description: editDescription,
        questions: formattedQuestions,
      }, { withCredentials: true });

      setMessage(response.data.message);
      setEditingQuiz(null); // Close the modal

      // Re-fetch quizzes after update
      console.log(`AdminDashboard: Re-fetching quizzes from ${API_BASE_URL}/quizzes`);
      const quizzesRes = await axios.get(`${API_BASE_URL}/quizzes`, { withCredentials: true });
      setQuizzes(quizzesRes.data);
    } catch (err) {
      console.error('Failed to update quiz:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to update quiz. Check server logs.');
    }
  };

  // --- User Management Handlers ---
  const handleToggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      console.log(`AdminDashboard: Toggling role for user ${userId} to ${newRole} at ${API_BASE_URL}/admin/user/${userId}`);
      const res = await axios.patch(`${API_BASE_URL}/admin/user/${userId}`, { role: newRole }, { withCredentials: true });
      setMessage(res.data.message);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error changing user role:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to update user role. You cannot change your own role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      console.log(`AdminDashboard: Deleting user ${userId} from ${API_BASE_URL}/admin/user/${userId}`);
      await axios.delete(`${API_BASE_URL}/admin/user/${userId}`, { withCredentials: true });
      setMessage('User deleted successfully!');
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err.response?.data?.message || err.message || err);
      setError(err.response?.data?.message || 'Failed to delete user. You cannot delete your own account.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white pt-24 md:pt-32">
      <h1 className="text-5xl md:text-6xl font-extrabold text-purple-300 mb-10 tracking-tight animate-fadeIn">Admin Dashboard</h1>

      {/* Main Messages */}
      {message && (
        <div className="bg-green-600/30 backdrop-blur-sm border border-green-400/50 text-green-200 px-6 py-3 rounded-xl relative mb-6 max-w-2xl w-full animate-slideInDown">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-600/30 backdrop-blur-sm border border-red-400/50 text-red-200 px-6 py-3 rounded-xl relative mb-6 max-w-2xl w-full animate-slideInDown">
          {error}
        </div>
      )}

      {/* Quiz Creation Form */}
      <div className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl max-w-3xl w-full border border-white/20 mb-12 animate-fadeIn delay-100">
        <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-300 mb-8 text-center">Create New Quiz</h2>

        <form onSubmit={createQuiz} className="space-y-6">
          <div>
            <label htmlFor="quizTitle" className="block text-gray-200 text-lg font-semibold mb-2">Quiz Title:</label>
            <input
              type="text"
              id="quizTitle"
              className="w-full px-5 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-300"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="quizDescription" className="block text-gray-200 text-lg font-semibold mb-2">Description (Optional):</label>
            <textarea
              id="quizDescription"
              className="w-full px-5 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-300 h-32 resize-y"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
            ></textarea>
          </div>

          {questions.map((question, qIndex) => (
            <div key={`create-q-${qIndex}`} className="p-6 border border-white/20 rounded-xl bg-white/5 shadow-inner space-y-4">
              <h3 className="text-xl md:text-2xl font-bold text-purple-300 mb-4">Question {qIndex + 1}</h3>
              <div>
                <label htmlFor={`create-q-text-${qIndex}`} className="block text-gray-200 text-md font-semibold mb-2">Question Text:</label>
                <input
                  type="text"
                  id={`create-q-text-${qIndex}`}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  value={question.questionText}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-200 text-md font-semibold mb-2">Options:</label>
                {question.options.map((option, oIndex) => (
                  <div key={`create-q-${qIndex}-o-${oIndex}`} className="flex items-center mb-2">
                    <input
                      type="radio"
                      id={`create-option-${qIndex}-${oIndex}`}
                      name={`create-correctOption-${qIndex}`}
                      className="mr-3 w-5 h-5 text-purple-400 bg-gray-700 border-gray-600 focus:ring-purple-500"
                      checked={question.correctOptionIndex === oIndex}
                      onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                    />
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
          >
            Add Another Question
          </button>

          <button
            type="submit"
            className="w-full bg-green-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
          >
            Create Quiz
          </button>
        </form>
      </div>

      {/* Existing Quizzes List */}
      <div className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl max-w-3xl w-full border border-white/20 mb-12 animate-fadeIn delay-200">
        <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-300 mb-8 text-center">Existing Quizzes</h2>
        {quizzes.length === 0 ? (
          <p className="text-gray-300 text-lg text-center">No quizzes available yet. Create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="border border-white/20 p-6 rounded-xl flex flex-col justify-between items-start bg-white/5 shadow-inner hover:bg-white/10 transition duration-300">
                <div>
                  <h3 className="font-bold text-xl text-purple-300 mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-300 mb-4">{quiz.questions.length} questions</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full">
                  <button
                    onClick={() => editQuiz(quiz._id)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => triggerConfirm('Are you sure you want to delete this quiz and all associated results?', handleDeleteQuiz, quiz._id, 'quiz')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-700 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage users */}
      <div className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl max-w-3xl w-full border border-white/20 mb-12 animate-fadeIn delay-300">
        <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-300 mb-8 text-center">User Management</h2>
        {users.length === 0 ? (
          <p className="text-gray-300 text-lg text-center">No users found.</p>
        ) : (
          <div className="space-y-6">
            {users.map((user) => (
              <div key={user._id} className="border border-white/20 p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center bg-white/5 shadow-inner hover:bg-white/10 transition duration-300">
                <div className="text-center sm:text-left mb-4 sm:mb-0">
                  <p className="text-lg font-bold text-purple-300">{user.username}</p>
                  <p className="text-md text-gray-300 mb-2">{user.email}</p>
                  <p className={`text-sm font-medium ${user.role === 'admin' ? 'text-green-400' : 'text-gray-400'}`}>Role: {user.role}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => triggerConfirm(
                      `Are you sure you want to ${user.role === 'admin' ? 'demote' : 'promote'} this user?`,
                      handleToggleAdmin,
                      user._id,
                      user.role === 'admin' ? 'demote' : 'promote',
                      user.role
                    )}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 ${
                      user.role === 'admin'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-400'
                        : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-400'
                    }`}
                  >
                    {user.role === 'admin' ? 'Demote' : 'Promote to Admin'}
                  </button>
                  <button
                    onClick={() => triggerConfirm('Are you sure you want to delete this user and all their quiz results?', handleDeleteUser, user._id, 'user')}
                    className="px-5 py-2 rounded-full text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Editing Modal/Form */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <form onSubmit={handleUpdateQuiz} className="bg-white/10 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative border border-white/20 animate-scaleIn">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-bold transition-colors duration-200"
            >
              &times;
            </button>
            <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-300 mb-8 text-center">Edit Quiz: {editingQuiz.title}</h2>

            {message && <div className="bg-green-600/30 border border-green-400/50 text-green-200 px-6 py-3 rounded-xl relative mb-6">{message}</div>}
            {error && <div className="bg-red-600/30 border border-red-400/50 text-red-200 px-6 py-3 rounded-xl relative mb-6">{error}</div>}

            <div className="space-y-6">
              <div>
                <label htmlFor="editQuizTitle" className="block text-gray-200 text-lg font-semibold mb-2">Quiz Title:</label>
                <input
                  type="text"
                  id="editQuizTitle"
                  className="w-full px-5 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-300"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="editQuizDescription" className="block text-gray-200 text-lg font-semibold mb-2">Description (Optional):</label>
                <textarea
                  id="editQuizDescription"
                  className="w-full px-5 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition duration-300 h-32 resize-y"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                ></textarea>
              </div>

              {editQuestions.map((question, qIndex) => (
                <div key={`edit-q-${qIndex}`} className="p-6 border border-white/20 rounded-xl bg-white/5 shadow-inner space-y-4">
                  <h3 className="text-xl md:text-2xl font-bold text-purple-300 mb-4 flex justify-between items-center">
                    Question {qIndex + 1}
                    <button
                      type="button"
                      onClick={() => handleRemoveEditQuestion(qIndex)}
                      className="text-red-400 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
                    >
                      &times;
                    </button>
                  </h3>
                  <div>
                    <label htmlFor={`edit-q-text-${qIndex}`} className="block text-gray-200 text-md font-semibold mb-2">Question Text:</label>
                    <input
                      type="text"
                      id={`edit-q-text-${qIndex}`}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      value={question.questionText}
                      onChange={(e) => handleEditQuestionTextChange(qIndex, e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-200 text-md font-semibold mb-2">Options:</label>
                    {question.options.map((option, oIndex) => (
                      <div key={`edit-q-${qIndex}-o-${oIndex}`} className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`edit-option-${qIndex}-${oIndex}`}
                          name={`edit-correctOption-${qIndex}`}
                          className="mr-3 w-5 h-5 text-purple-400 bg-gray-700 border-gray-600 focus:ring-purple-500"
                          checked={question.correctOptionIndex === oIndex}
                          onChange={() => handleEditCorrectOptionChange(qIndex, oIndex)}
                        />
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) => handleEditOptionChange(qIndex, oIndex, e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditOption(qIndex, oIndex)}
                          className="ml-3 text-red-400 hover:text-red-500 text-2xl font-bold transition-colors duration-200"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddEditOption(qIndex)}
                      className="mt-3 bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-all duration-300 shadow-md"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddEditQuestion}
                className="w-full bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
              >
                Add Another Question
              </button>

              <button
                type="submit"
                className="w-full bg-green-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
              >
                Update Quiz
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modern Pop-up Confirmation */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-3xl p-8 max-w-md w-full text-center border border-white/20 animate-scaleIn">
            <p className="text-xl md:text-2xl font-bold text-gray-200 mb-8 leading-relaxed">{popupMessage}</p>
            <div className="flex justify-center space-x-6">
              <button
                onClick={handleConfirm}
                className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
              >
                Confirm
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-600 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;