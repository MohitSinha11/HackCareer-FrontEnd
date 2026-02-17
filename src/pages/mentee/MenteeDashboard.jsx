export default function MenteeDashboard({ mentee, mentor }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">My Profile</h2>
      <p className="mt-2 text-sm text-slate-700">Name: {mentee.name}</p>
      <p className="text-sm text-slate-700">Email: {mentee.email}</p>
      <p className="mt-2 text-sm text-slate-700">About: {mentee.about || 'N/A'}</p>
      <p className="mt-2 text-sm text-slate-700">Mentor: {mentor ? mentor.name : 'Not assigned yet'}</p>
    </section>
  );
}
