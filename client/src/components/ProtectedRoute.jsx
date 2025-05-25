import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, requiredRole }) => {
  // If 'user' is null (meaning no user is logged in), redirect to the login page.
  // 'replace' prop ensures that navigating back won't go to the protected page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a 'requiredRole' is specified AND the logged-in user's role does NOT match,
  // redirect them to the quizzes page (or another appropriate unauthorized page).
  if (requiredRole && user.role !== requiredRole) {
    // For example, redirect non-admins trying to access the admin page.
    return <Navigate to="/quizzes" replace />;
  }

  // If all checks pass (user is logged in and has the required role if any),
  // render the child components (the actual page content).
  return children;
};

export default ProtectedRoute;