export default function AdminDashboard({ admin, mentors, mentees }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Mentors</p>
          <p className="text-2xl font-bold text-slate-900">{mentors.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Mentees</p>
          <p className="text-2xl font-bold text-slate-900">{mentees.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Admin Profile</p>
          <p className="text-lg font-semibold text-slate-900">{admin.name}</p>
          <p className="text-xs text-slate-600">{admin.email}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Mentor-Mentee Mapping</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {mentees.map((mentee) => {
            const mentor = mentors.find((m) => m.id === mentee.mentorId);
            return (
              <li key={mentee.id} className="rounded-md bg-slate-50 px-3 py-2">
                <span className="font-medium">{mentee.name}</span>
                <span className="text-slate-600">{' -> '}</span>
                <span className="text-slate-700">{mentor ? mentor.name : 'Not assigned'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
