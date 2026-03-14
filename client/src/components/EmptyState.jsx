import { Inbox } from 'lucide-react';

export default function EmptyState({ title, message, description, icon, action }) {
  // Accepts both `message` (old usage in pages) and `title` (original API)
  const displayTitle = title || message || 'Nothing here yet';
  const desc         = description;

  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-[#F4F4F5] flex items-center justify-center mb-4 text-[#A1A1AA]">
        {icon || <Inbox className="w-5 h-5" strokeWidth={1.5} />}
      </div>
      <h3 className="text-sm font-semibold text-[#18181B] mb-1">{displayTitle}</h3>
      {desc && <p className="text-xs text-[#A1A1AA] max-w-xs">{desc}</p>}
      {action && (
        <button onClick={action.onClick} className="mt-5 btn btn-primary text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
