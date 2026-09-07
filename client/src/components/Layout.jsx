import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Layout({ children }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <nav className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold text-lg">
            Blog Platform
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link to="/write" className="hover:underline">
                  Write
                </Link>
                <Link to="/dashboard" className="hover:underline">
                  Dashboard
                </Link>
                <span className="text-slate-500">{user.name}</span>
                <button onClick={handleLogout} className="hover:underline">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">
                  Log in
                </Link>
                <Link to="/register" className="hover:underline">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500">
        Blog Platform &mdash; a markdown blog CMS demo
      </footer>
    </div>
  );
}
