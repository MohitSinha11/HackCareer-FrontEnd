import { useState } from 'react';

const initialForm = {
  title: '',
  date: '',
  time: '',
  meetingLink: '',
};

export default function MeetingPage({ selectedMentee, onCreateMeeting, meetings }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedMentee) {
      setMessage('Select a mentee first.');
      return;
    }

    const result = await onCreateMeeting(form);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setForm(initialForm);
    setMessage('Meeting created successfully.');
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Create Meeting</h2>
        <p className="mt-1 text-sm text-slate-600">
          Selected mentee: {selectedMentee ? selectedMentee.name : 'None'}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Meeting title"
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="url"
            name="meetingLink"
            value={form.meetingLink}
            onChange={handleChange}
            placeholder="Meeting link (Zoom / Google Meet / Teams)"
            required
          />
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Create Meeting
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Meetings for Selected Mentee</h2>
        <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1 text-sm">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="rounded-md bg-slate-50 px-3 py-2">
              <p className="font-medium">{meeting.title}</p>
              <p className="text-xs text-slate-500">
                {meeting.date} at {meeting.time}
              </p>
              {meeting.meetingLink ? (
                <a
                  className="mt-1 inline-block text-xs font-medium text-blue-700 hover:underline"
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open meeting link
                </a>
              ) : null}
            </li>
          ))}
          {meetings.length === 0 ? <li className="text-slate-500">No meetings yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
