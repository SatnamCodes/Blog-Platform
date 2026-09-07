import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import PageLoading from './components/PageLoading.jsx';
import { useAuthStore } from './store/authStore.js';

import Home from './pages/Home.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Route-level code splitting: the editor (react-markdown + remark/rehype +
// highlight.js pipeline) and the dashboard are excluded from the initial
// bundle since most visitors only ever read posts on `/`.
const Editor = lazy(() => import('./pages/Editor.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Layout>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:slug" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/write"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/edit/:slug"
            element={
              <RequireAuth>
                <Editor />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
