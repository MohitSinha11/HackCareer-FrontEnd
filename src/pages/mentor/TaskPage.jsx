import { useState } from 'react';

const initialForm = {
  title: '',
  description: '',
  dueDate: '',
};

export default function TaskPage({ selectedMentee, onCreateTask, onReviewTask, tasks }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [reviewForms, setReviewForms] = useState({});

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

    const result = await onCreateTask(form);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setForm(initialForm);
    setMessage('Task assigned successfully.');
  };

  const handleReviewChange = (taskId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [taskId]: {
        rating: prev[taskId]?.rating || '5',
        comment: prev[taskId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (event, taskId) => {
    event.preventDefault();
    const formState = reviewForms[taskId] || { rating: '5', comment: '' };
    const result = await onReviewTask({
      taskId,
      rating: formState.rating,
      comment: formState.comment,
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage('Mentee performance review saved.');
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Assign Task</h2>
        <p className="mt-1 text-sm text-slate-600">
          Selected mentee: {selectedMentee ? selectedMentee.name : 'None'}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Task title"
            required
          />
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Task details"
            rows={3}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            required
          />
          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
          >
            Create Task
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Tasks for Selected Mentee</h2>
        <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1 text-sm">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-md bg-slate-50 px-3 py-2">
              <p className="font-medium">{task.title}</p>
              <p className="text-slate-600">{task.description}</p>
              <p className="text-xs text-slate-500">Due: {task.dueDate}</p>
              <p className="text-xs text-slate-500">Status: {task.status}</p>

              {task.menteeReviewForMentor ? (
                <div className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-700">
                  <p className="font-semibold">Mentee Feedback for Mentor</p>
                  <p>
                    Rating: {'★'.repeat(task.menteeRatingForMentor || 0)}
                    {'☆'.repeat(5 - (task.menteeRatingForMentor || 0))}
                  </p>
                  <p>{task.menteeReviewForMentor}</p>
                </div>
              ) : null}

              {task.status === 'done' ? (
                <form className="mt-2 space-y-2" onSubmit={(event) => handleReviewSubmit(event, task.id)}>
                  <label className="block text-xs text-slate-600">
                    Rate mentee performance
                    <div className="mt-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const selected = Number(reviewForms[task.id]?.rating || '5');
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`text-lg ${star <= selected ? 'text-amber-500' : 'text-slate-300'}`}
                            onClick={() => handleReviewChange(task.id, 'rating', String(star))}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  </label>
                  <textarea
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    rows={2}
                    placeholder="Comment on mentee performance"
                    value={reviewForms[task.id]?.comment || ''}
                    onChange={(event) => handleReviewChange(task.id, 'comment', event.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Save Review
                  </button>
                </form>
              ) : null}

              {task.mentorReviewForMentee ? (
                <div className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-700">
                  <p className="font-semibold">Your Review for Mentee</p>
                  <p>
                    Rating: {'★'.repeat(task.mentorRatingForMentee || 0)}
                    {'☆'.repeat(5 - (task.mentorRatingForMentee || 0))}
                  </p>
                  <p>{task.mentorReviewForMentee}</p>
                </div>
              ) : null}
            </li>
          ))}
          {tasks.length === 0 ? <li className="text-slate-500">No tasks yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
