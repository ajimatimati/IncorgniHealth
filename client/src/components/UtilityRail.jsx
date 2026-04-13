import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { SOSTrigger } from './SOSModal';
import JournalModal from './JournalModal';
import MoodModal from './MoodModal';
import SafetyCheckModal from './SafetyCheckModal';

export default function UtilityRail() {
  const { user } = useAuth();
  const toast = useToast();
  const [activePanel, setActivePanel] = useState(null);

  const togglePanel = (panelName) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const openGlobalSOS = () => {
    window.dispatchEvent(new Event('open-sos'));
  };

  return (
    <>
      {/* The visible thin rail on the far right */}
      <aside className="hidden xl:flex flex-col w-16 xl:w-20 border-l border-outline-variant/10 bg-surface-container-lowest items-center py-6 z-40 shrink-0 select-none">
        
        {/* Top group */}
        <div className="flex flex-col gap-4 w-full px-2 lg:px-3">
          <RailAction 
            icon="notifications" 
            badge="2" 
            isActive={activePanel === 'notifications'}
            onClick={() => togglePanel('notifications')}
            tooltip="Alerts"
          />
          <RailAction 
            icon="mark_email_unread" 
            badge="1" 
            isActive={activePanel === 'messages'}
            onClick={() => togglePanel('messages')}
            tooltip="Inbox"
          />
        </div>

        {/* Bottom group */}
        <div className="mt-auto flex flex-col gap-4 w-full px-2 lg:px-3">
          <RailAction 
            icon="add_circle" 
            isActive={activePanel === 'quickAdd'}
            onClick={() => togglePanel('quickAdd')}
            className="text-primary mt-2"
            tooltip="Quick Add"
          />
          <div className="w-8 h-px bg-outline-variant/10 mx-auto my-2" />
          <SOSTrigger onActivate={openGlobalSOS}>
            <RailAction 
              icon="emergency"
              isActive={false}
              className="text-error bg-error/10 hover:bg-error/20 rounded-full"
              tooltip="Global SOS (Hold)"
            />
          </SOSTrigger>
        </div>
      </aside>

      {/* Flyout panel */}
      <AnimatePresence>
        {activePanel && (
          <>
            {/* Overlay to catch clicks outside */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-transparent z-30" 
              onClick={() => setActivePanel(null)}
            />
            {/* Slide-out pane attached to the rail */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-16 xl:right-20 w-80 h-full border-l border-outline-variant/10 shadow-2xl z-30"
              style={{
                backgroundColor: 'var(--surface-container-low, #1e1e1e)', // Use a slightly elevated color for the drawer
              }}
            >
              <div className="p-6 h-full flex flex-col bg-surface-container-low min-h-screen">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-headline text-base font-bold text-on-surface capitalize">
                    {activePanel.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <button onClick={() => setActivePanel(null)} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
                    close
                  </button>
                </div>
                
                {/* Content based on active panel */}
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4">
                  {activePanel === 'notifications' && <NotificationsPanel />}
                  {activePanel === 'messages' && <MessagesPanel />}
                  {activePanel === 'quickAdd' && <QuickAddPanel />}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function RailAction({ icon, badge, isActive, onClick, tooltip, className = '' }) {
  return (
    <div className="relative group w-full flex justify-center">
      <button
        onClick={onClick}
        className={`w-10 h-10 xl:w-12 xl:h-12 flex items-center justify-center rounded-2xl transition-all duration-200 ${
          isActive 
            ? 'bg-surface-container-highest text-on-surface shadow-inner' 
            : 'text-outline hover:text-on-surface hover:bg-surface-container hover:shadow-md'
        } ${className}`}
      >
        <span className="material-symbols-outlined xl:text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
          {icon}
        </span>
      </button>

      {/* Badge */}
      {badge && (
        <span className="absolute top-1 lg:top-2 right-1 lg:right-2 w-4 h-4 rounded-full bg-primary text-on-primary font-label text-[8px] flex items-center justify-center font-bold ring-2 ring-background">
          {badge}
        </span>
      )}

      {/* Tooltip */}
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-on-surface text-surface font-label text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        {tooltip}
      </span>
    </div>
  );
}

function NotificationsPanel() {
  const [read, setRead] = useState(false);
  const data = read ? [] : [
    { title: 'Prescription Ready', desc: 'Your test kit order is verified and dispatched.', time: '10 min ago' },
    { title: 'System Update', desc: 'Data retention policy changes are awaiting acknowledgement.', time: '2 hours ago' },
  ];

  if (data.length === 0) return (
    <div className="text-center py-10 opacity-50">
      <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
      <p className="font-label text-xs uppercase tracking-widest">All caught up</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="p-4 bg-surface-container rounded-[20px] border border-outline-variant/5">
          <p className="font-headline text-sm font-bold text-on-surface">{item.title}</p>
          <p className="font-body text-xs text-on-surface-variant mt-1">{item.desc}</p>
          <p className="font-label text-[9px] text-primary uppercase tracking-widest mt-3">{item.time}</p>
        </div>
      ))}
      <button onClick={() => setRead(true)} className="w-full text-center mt-4 font-label text-[10px] text-outline uppercase tracking-widest hover:text-on-surface">
        Clear All
      </button>
    </div>
  );
}

function MessagesPanel() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="text-center py-6">
         <span className="material-symbols-outlined text-4xl text-outline mb-2">chat_bubble</span>
         <p className="font-label text-xs uppercase tracking-widest text-outline">No Active Chats</p>
         <button onClick={() => navigate('/directory')} className="mt-4 px-4 py-2 bg-surface-container-high rounded-lg font-label text-[10px] uppercase tracking-widest text-on-surface hover:bg-surface-container-highest">
           Find a Doctor
         </button>
      </div>
    </div>
  );
}

function QuickAddPanel() {
  const [journalOpen, setJournalOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const toast = useToast();

  const handleVault = () => {
    // Fake file upload dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = () => {
      if (input.files && input.files[0]) {
        toast.success(`"${input.files[0].name}" safely encrypted to your vault.`);
      }
    };
    input.click();
  };

  const triggerSOS = () => window.dispatchEvent(new Event('open-sos'));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setJournalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-container rounded-[20px] border border-outline-variant/5 hover:border-outline-variant/20 transition-colors group">
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform text-primary">edit_note</span>
          <span className="font-label text-[9px] text-on-surface uppercase tracking-widest text-center mt-2">Journal</span>
        </button>
        <button onClick={() => setMoodOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-container rounded-[20px] border border-outline-variant/5 hover:border-outline-variant/20 transition-colors group">
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform text-secondary">sentiment_satisfied</span>
          <span className="font-label text-[9px] text-on-surface uppercase tracking-widest text-center mt-2">Log Mood</span>
        </button>
        <button onClick={() => setSafetyOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-container rounded-[20px] border border-outline-variant/5 hover:border-outline-variant/20 transition-colors group">
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform text-tertiary">shield</span>
          <span className="font-label text-[9px] text-on-surface uppercase tracking-widest text-center mt-2">Safety Check</span>
        </button>
        <button onClick={handleVault} className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-container rounded-[20px] border border-outline-variant/5 hover:border-outline-variant/20 transition-colors group">
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform text-on-surface">upload_file</span>
          <span className="font-label text-[9px] text-on-surface uppercase tracking-widest text-center mt-2">Upload Vault</span>
        </button>
      </div>

      <JournalModal isOpen={journalOpen} onClose={() => setJournalOpen(false)} />
      <MoodModal isOpen={moodOpen} onClose={() => setMoodOpen(false)} />
      <SafetyCheckModal isOpen={safetyOpen} onClose={() => setSafetyOpen(false)} onSOS={triggerSOS} />
    </>
  );
}
