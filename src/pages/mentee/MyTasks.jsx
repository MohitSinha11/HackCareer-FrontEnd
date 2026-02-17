import { useState } from 'react';

export default function MyTasks({ tasks, meetings, onCompleteTask }) {
  const [completionForms, setCompletionForms] = useState({});
  const [message, setMessage] = useState('');

  const handleCompletionChange = (taskId, field, value) => {
    setCompletionForms((prev) => ({
      ...prev,
      [taskId]: {
        rating: prev[taskId]?.rating || '5',
        comment: prev[taskId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const handleCompletionSubmit = async (event, taskId) => {
    event.preventDefault();
    const formState = completionForms[taskId] || { rating: '5', comment: '' };

    const result = await onCompleteTask({
      taskId,
      rating: formState.rating,
      comment: formState.comment,
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage('Task marked complete and feedback submitted.');
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">My Tasks</h2>
        {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
        <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1 text-sm">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-md bg-slate-50 px-3 py-2">
              <p className="font-medium">{task.title}</p>
              <p className="text-slate-600">{task.description}</p>
              <p className="text-xs text-slate-500">Due: {task.dueDate}</p>
              <p className="text-xs text-slate-500">Status: {task.status}</p>

              {task.status !== 'done' ? (
                <form className="mt-2 space-y-2" onSubmit={(event) => handleCompletionSubmit(event, task.id)}>
                  <label className="block text-xs text-slate-600">
                    Rate mentor for this task
                    <div className="mt-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const selected = Number(completionForms[task.id]?.rating || '5');
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`text-lg ${star <= selected ? 'text-amber-500' : 'text-slate-300'}`}
                            onClick={() => handleCompletionChange(task.id, 'rating', String(star))}
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
                    placeholder="Comment for mentor"
                    value={completionForms[task.id]?.comment || ''}
                    onChange={(event) => handleCompletionChange(task.id, 'comment', event.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Mark Complete
                  </button>
                </form>
              ) : null}

              {task.menteeReviewForMentor ? (
                <div className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-700">
                  <p className="font-semibold">Your Feedback for Mentor</p>
                  <p>
                    Rating: {'★'.repeat(task.menteeRatingForMentor || 0)}
                    {'☆'.repeat(5 - (task.menteeRatingForMentor || 0))}
                  </p>
                  <p>{task.menteeReviewForMentor}</p>
                </div>
              ) : null}

              {task.mentorReviewForMentee ? (
                <div className="mt-2 rounded bg-white px-2 py-1 text-xs text-slate-700">
                  <p className="font-semibold">Mentor Review for You</p>
                  <p>
                    Rating: {'★'.repeat(task.mentorRatingForMentee || 0)}
                    {'☆'.repeat(5 - (task.mentorRatingForMentee || 0))}
                  </p>
                  <p>{task.mentorReviewForMentee}</p>
                </div>
              ) : null}
            </li>
          ))}
          {tasks.length === 0 ? <li className="text-slate-500">No tasks assigned yet.</li> : null}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">My Meetings</h2>
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
                  Join meeting
                </a>
              ) : null}
            </li>
          ))}
          {meetings.length === 0 ? <li className="text-slate-500">No meetings scheduled yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
