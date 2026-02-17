import { useState } from 'react';

const defaultLoginForm = {
  email: '',
  password: '',
  role: 'admin',
};

const defaultSignupForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function Login({ onLogin, onAdminSignup }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [signupForm, setSignupForm] = useState(defaultSignupForm);
  const [error, setError] = useState('');

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const result = await onLogin(loginForm);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError('');
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    const result = await onAdminSignup({
      fullName: signupForm.fullName,
      email: signupForm.email,
      password: signupForm.password,
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError('');
  };

  return (
    <main className="mx-auto mt-16 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{mode === 'login' ? 'Login' : 'Admin Sign Up'}</h1>
        <button
          type="button"
          className="text-sm font-medium text-slate-700 underline"
          onClick={() => {
            setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
            setError('');
          }}
        >
          {mode === 'login' ? 'Admin Sign Up' : 'Back to Login'}
        </button>
      </div>

      {mode === 'login' ? (
        <>
          <p className="mt-2 text-sm text-slate-600">Use email, password and role to sign in.</p>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Role</span>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                name="role"
                value={loginForm.role}
                onChange={handleLoginChange}
              >
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
              </select>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
            >
              Login
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">Create admin account and continue directly to admin dashboard.</p>

          <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Full Name</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="text"
                name="fullName"
                value={signupForm.fullName}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="email"
                name="email"
                value={signupForm.email}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="password"
                name="password"
                value={signupForm.password}
                onChange={handleSignupChange}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                type="password"
                name="confirmPassword"
                value={signupForm.confirmPassword}
                onChange={handleSignupChange}
                required
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
            >
              Create Admin Account
            </button>
          </form>
        </>
      )}

      <div className="mt-6 rounded-md bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold">Preset credentials</p>
        <p>Admin: admin@hackcareer.com / Admin@123</p>
        <p>Mentor: mentor1@hackcareer.com / Mentor@123</p>
        <p>Mentee: mentee1@hackcareer.com / Mentee@123</p>
      </div>
    </main>
  );
}
