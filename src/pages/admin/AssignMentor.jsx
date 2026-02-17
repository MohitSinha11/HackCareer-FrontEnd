import { useState } from 'react';

export default function AssignMentor({ mentors, mentees, onAssign }) {
  const [mentorId, setMentorId] = useState(mentors[0]?.id || '');
  const [menteeId, setMenteeId] = useState(mentees[0]?.id || '');
  const [message, setMessage] = useState('');

  const handleAssign = async (event) => {
    event.preventDefault();

    if (!mentorId || !menteeId) {
      setMessage('Please choose both mentor and mentee.');
      return;
    }

    const result = await onAssign({ mentorId, menteeId });
    setMessage(result.ok ? 'Mentor assigned successfully.' : result.message);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Assign Mentor to Mentee</h2>

      <form onSubmit={handleAssign} className="mt-4 grid gap-3 md:grid-cols-3">
        <select
          className="rounded-md border border-slate-300 px-3 py-2"
          value={mentorId}
          onChange={(event) => setMentorId(event.target.value)}
        >
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-300 px-3 py-2"
          value={menteeId}
          onChange={(event) => setMenteeId(event.target.value)}
        >
          {mentees.map((mentee) => (
            <option key={mentee.id} value={mentee.id}>
              {mentee.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
        >
          Assign
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}
