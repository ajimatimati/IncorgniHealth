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
      className="fixed bottom-24 lg:bottom-10 right-6 md:right-10 w-16 h-16 rounded-full bg-error text-white border-2 border-red-700 shadow-[0_4px_0_#5f0003] flex items-center justify-center hover:bg-red-600 active:translate-y-[3px] active:shadow-[0_1px_0_#5f0003] transition-all z-[9999] group overflow-hidden"
      title="Quick Exit"
    >
      <span className="material-symbols-outlined text-3xl">exit_to_app</span>
      <div className="absolute inset-x-0 bottom-1 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pb-0.5">
        <span className="text-[7px] font-label font-bold uppercase tracking-widest text-white/90">Exit</span>
      </div>
    </button>
  );
}
