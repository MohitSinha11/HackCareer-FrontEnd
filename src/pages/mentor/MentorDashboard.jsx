export default function MentorDashboard({ mentor, mentees }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">My Profile</h2>
        <p className="mt-2 text-sm text-slate-700">Name: {mentor.name}</p>
        <p className="text-sm text-slate-700">Email: {mentor.email}</p>
        <p className="mt-2 text-sm text-slate-700">About: {mentor.about || 'N/A'}</p>
        <p className="mt-2 text-sm text-slate-700">Review: {mentor.review || 'N/A'}</p>
        <p className="text-sm text-slate-700">Rating: {mentor.rating || 0}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Mentees Under Me</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {mentees.map((mentee) => (
            <li key={mentee.id} className="rounded-md bg-slate-50 px-3 py-2">
              {mentee.name} ({mentee.email})
            </li>
          ))}
          {mentees.length === 0 ? <li className="text-slate-500">No mentees assigned yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
