import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageContext, useLanguageState } from './hooks/useLanguage';
import { AuthProvider } from './hooks/useAuth';
import MainLayout from './components/layouts/MainLayout';
import RootLayout from './components/layouts/RootLayout';
import AdminLayout from './components/layouts/AdminLayout';
import PrivateRoute from './components/ui/PrivateRoute';
import AdminRoute from './components/ui/AdminRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import HomePage from './pages/HomePage';
import ArticleListPage from './pages/articles/ArticleListPage';
import ArticleDetailPage from './pages/articles/ArticleDetailPage';
import FeedPage from './pages/posts/FeedPage';
import PostDetailPage from './pages/posts/PostDetailPage';
import PostFormPage from './pages/posts/PostFormPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminArticlesPage from './pages/admin/AdminArticlesPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';

function App() {
  const languageState = useLanguageState();

  return (
    <LanguageContext.Provider value={languageState}>
      <AuthProvider>
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

            {/* Admin pages — admin role required */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminHomePage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/articles" element={<AdminArticlesPage />} />
                <Route path="/admin/posts" element={<AdminPostsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageContext.Provider>
  );
}

export default App;
