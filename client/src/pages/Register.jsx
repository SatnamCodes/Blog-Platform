import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const doRegister = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    const ok = await doRegister(values);
    if (ok) navigate('/');
  };

  return (
    <div className="max-w-sm mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="w-full border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white rounded py-2 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {isSubmitting ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="text-sm mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
