import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">404 — Page not found</h1>
      <Link to="/" className="text-blue-600 hover:underline">
        Back to home
      </Link>
    </div>
  );
}
