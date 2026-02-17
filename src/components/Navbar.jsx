export default function Navbar({ user, onLogout }) {
  return (
    <header className="flex items-center justify-between rounded-xl bg-slate-900 p-4 text-white">
      <div>
        <p className="text-sm text-slate-300">HackCareer Portal</p>
        <h1 className="text-lg font-semibold capitalize">{user.role} Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-slate-300">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
