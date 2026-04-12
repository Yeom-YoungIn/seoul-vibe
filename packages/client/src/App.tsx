import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RootLayout from './components/layouts/RootLayout';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
