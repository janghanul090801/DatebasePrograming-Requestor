import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WorkspacePage from './pages/WorkspacePage';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage setIsLoggedIn={setIsLoggedIn} />
          )
        }
      />
      <Route
        path="/signup"
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <SignupPage setIsLoggedIn={setIsLoggedIn} />
          )
        }
      />
      <Route
        path="*"
        element={
          <WorkspacePage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        }
      />
    </Routes>
  );
};

export default App;
