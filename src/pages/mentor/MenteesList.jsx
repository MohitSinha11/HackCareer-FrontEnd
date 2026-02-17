export default function MenteesList({ mentees, selectedMenteeId, onSelect }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">Select a Mentee</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {mentees.map((mentee) => {
          const isSelected = selectedMenteeId === mentee.id;
          return (
            <button
              type="button"
              key={mentee.id}
              onClick={() => onSelect(mentee.id)}
              className={`rounded-md border px-3 py-2 text-left ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <p className="font-medium">{mentee.name}</p>
              <p className="text-xs opacity-80">{mentee.email}</p>
            </button>
          );
        })}
      </div>
      {mentees.length === 0 ? <p className="mt-2 text-sm text-slate-500">No mentees assigned.</p> : null}
    </section>
  );
}
