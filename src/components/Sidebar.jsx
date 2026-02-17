export default function Sidebar({ items, active, onSelect }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-3">
      <ul className="space-y-2">
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <li key={item.value}>
              <button
                type="button"
                onClick={() => onSelect(item.value)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
