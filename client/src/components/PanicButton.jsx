import { useNavigate } from 'react-router-dom';

export default function PanicButton() {
  const handlePanic = () => {
    // 1. Obliterate all local traces
    localStorage.clear();
    sessionStorage.clear();
    
    // 2. Instantly redirect browser history without leaving a back-button trace
    window.location.replace('https://weather.com');
  };

  return (
    <button
      onClick={handlePanic}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 rounded-full bg-error text-white shadow-2xl shadow-error/40 flex items-center justify-center hover:scale-110 hover:bg-red-600 active:scale-95 transition-all z-[9999] group overflow-hidden"
      title="Quick Exit"
    >
      <span className="material-symbols-outlined text-3xl">exit_to_app</span>
      <div className="absolute inset-x-0 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pb-0.5">
        <span className="text-[7px] font-label font-bold uppercase tracking-widest text-white/90">Exit</span>
      </div>
    </button>
  );
}
