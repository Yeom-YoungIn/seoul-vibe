import { BrowserRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import RootLayout from './components/layouts/RootLayout';
import PrivateRoute from './components/ui/PrivateRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import HomePage from './pages/HomePage';
import ArticleListPage from './pages/articles/ArticleListPage';
import ArticleDetailPage from './pages/articles/ArticleDetailPage';
import FeedPage from './pages/posts/FeedPage';
import PostDetailPage from './pages/posts/PostDetailPage';
import PostFormPage from './pages/posts/PostFormPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth pages — no nav */}
        <Route element={<RootLayout />}>
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Main pages — with nav */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticleListPage />} />
          <Route path="/articles/:slug" element={<ArticleDetailPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />

          {/* Protected — login required */}
          <Route element={<PrivateRoute />}>
            <Route path="/posts/new" element={<PostFormPage mode="create" />} />
            <Route path="/posts/:id/edit" element={<PostFormPage mode="edit" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
