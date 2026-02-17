import { useState } from 'react';

const defaultForm = {
  name: '',
  email: '',
  role: 'mentor',
  password: 'Mentor@123',
  about: '',
};

export default function ManageUsers({ mentors, mentees, onCreateUser }) {
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'role') {
      const presetPassword = value === 'mentor' ? 'Mentor@123' : 'Mentee@123';
      setForm((prev) => ({ ...prev, role: value, password: presetPassword }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await onCreateUser(form);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage('User created successfully.');
    setForm({ ...defaultForm, role: form.role, password: form.password });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Create Mentor/Mentee</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
          </select>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Preset password"
            required
          />
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="about"
            value={form.about}
            onChange={handleChange}
            placeholder="Short profile/about"
            rows={3}
          />
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Create User
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Mentors</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {mentors.map((mentor) => (
              <li key={mentor.id} className="rounded-md bg-slate-50 px-3 py-2">
                {mentor.name} ({mentor.email})
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Mentees</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {mentees.map((mentee) => (
              <li key={mentee.id} className="rounded-md bg-slate-50 px-3 py-2">
                {mentee.name} ({mentee.email})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
