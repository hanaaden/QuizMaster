import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

const TakeQuizPage = () => {
  const { id } = useParams(); // quiz id from URL
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', null

  useEffect(() => {
    const fetchQuiz = async () => {
      // Essential check for API_BASE_URL
      if (!API_BASE_URL) {
        console.error("Error: API_BASE_URL is not defined. Please ensure it's set as an environment variable.");
        setError("Configuration error: Backend URL not found. Please contact support.");
        setLoading(false);
        return;
      }

      try {
        console.log(`TakeQuizPage: Fetching quiz ${id} from ${API_BASE_URL}/quizzes/${id}`);
        const res = await axios.get(`${API_BASE_URL}/quizzes/${id}`, { withCredentials: true });
        setQuiz(res.data);
        setAnswers(Array(res.data.questions.length).fill(null)); // Initialize answers array
        setLoading(false);
      } catch (err) {
        console.error("Error fetching quiz:", err.response?.data?.message || err.message || err);
        setError(err.response?.data?.message || 'Failed to load quiz. It might not exist or you are not authorized.');
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]); // Depend on id to refetch if quiz ID changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
        <p className="text-2xl font-semibold animate-pulse">Loading quiz...</p>
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

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 text-white">
        <p className="text-2xl font-semibold">Quiz not found or has no questions.</p>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];

  const handleAnswer = (optionIndex) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentIndex] = optionIndex;
    setAnswers(updatedAnswers);
  };

  const handleNext = async () => {
    if (answers[currentIndex] === null) {
      alert('Please select an answer before proceeding.');
      return;
    }

    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question, submit quiz
      setSubmissionStatus(null); // Reset status
      try {
        console.log(`TakeQuizPage: Submitting quiz ${id} to ${API_BASE_URL}/quiz/${id}/submit`);
        const res = await axios.post(
          `${API_BASE_URL}/quiz/${id}/submit`,
          { answers },
          { withCredentials: true }
        );
        setSubmissionStatus('success');
        
        // --- MODIFIED SECTION ---
        // Instead of alert and direct navigate to profile, navigate to ResultPage
        navigate('/result', {
          state: {
            score: res.data.score,
            total: res.data.total,
            quizTitle: quiz.title // Pass quiz title for better display on result page
          }
        });
        // --- END MODIFIED SECTION ---

      } catch (err) {
        console.error("Error submitting quiz:", err.response?.data?.message || err.message || err);
        setSubmissionStatus('error');
        // Keep the alert for submission errors for now
        alert(err.response?.data?.message || 'Error submitting quiz. Please try again.'); 
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 via-indigo-900 to-violet-950 p-6 pt-24 md:pt-32 relative"> {/* Added top padding to account for fixed navbar */}
      
      {/* Quiz Card */}
      <div className="max-w-3xl w-full mx-auto p-6 md:p-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-3xl border border-white/20 text-white animate-fadeInUp">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-center text-purple-300 tracking-tight">
          {quiz.title}
        </h2>
        
        {/* Progress Bar */}
        <div className="text-center mb-8">
          <p className="text-xl font-semibold text-white mb-2">Question {currentIndex + 1} of {quiz.questions.length}</p>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-purple-500 h-3 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question and Options Card */}
        <div className="mb-10 p-6 md:p-8 bg-white/15 rounded-xl shadow-lg border border-white/20">
          <p className="text-2xl md:text-3xl font-bold mb-6 text-white leading-relaxed">{question.questionText}</p>
          <div className="space-y-4">
            {question.options.map((opt, i) => (
              <label
                key={i}
                className={`block p-4 md:p-5 border rounded-lg cursor-pointer transition-all duration-300 ease-in-out
                  ${answers[currentIndex] === i
                    ? 'bg-purple-600 border-purple-400 ring-2 ring-purple-300 shadow-md'
                    : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40'
                  }
                `}
              >
                <input
                  type="radio"
                  name={`question-${currentIndex}`}
                  checked={answers[currentIndex] === i}
                  onChange={() => handleAnswer(i)}
                  className="mr-4 w-5 h-5 accent-purple-300 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-transparent"
                />
                <span className="text-lg md:text-xl text-white font-medium">{opt.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Next/Submit Button */}
        <button
          onClick={handleNext}
          className="w-full bg-purple-600 text-white px-8 py-4 rounded-full text-xl md:text-2xl font-bold
                    hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl
                    focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-violet-950 transform hover:-translate-y-1"
        >
          {currentIndex + 1 === quiz.questions.length ? 'Submit Quiz' : 'Next Question'}
        </button>

        {submissionStatus === 'error' && (
          <p className="text-red-300 mt-6 text-center text-lg bg-red-800/30 p-3 rounded-lg border border-red-500/50 animate-shake">
            There was an error submitting your quiz. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default TakeQuizPage;