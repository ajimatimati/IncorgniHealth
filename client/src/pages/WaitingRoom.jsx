import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function WaitingRoom() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (!socket) return;
    const handleAdmit = (data) => {
      if (data.roomId) {
        toast.success('Your physician is ready to see you.');
        navigate(`/consult/${data.roomId}`);
      }
    };
    socket.on('admit-patient', handleAdmit);
    return () => socket.off('admit-patient', handleAdmit);
  }, [socket, navigate, toast]);

  const joinQueue = () => {
    if (socket) {
      socket.emit('join-waiting-room', {
        doctorPublicId: doctorId,
        patientInfo: {
          nickname: user.nickname || 'Client',
          userId: user.id
        }
      });
      setJoined(true);
      toast.success('You have been securely added to the queue.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6 overflow-hidden relative">
      {/* Immersive background elements */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-tertiary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10"
      >
        {!joined ? (
          <section className="md:col-span-12 bg-surface-container-low p-12 rounded-[32px] text-center border border-outline-variant/10 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-lg shadow-primary/5">
              <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-extrabold text-on-surface">Secure Admission</h1>
              <p className="text-on-surface-variant max-w-lg mx-auto text-sm leading-relaxed">
                You are entering a private clinical area. Your identity and data are protected by end-to-end encryption. A physician will admit you shortly.
              </p>
            </div>

            <button 
              onClick={joinQueue}
              className="px-12 py-5 bg-primary text-on-primary font-headline rounded-full uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Enter Private Clinic
            </button>
          </section>
        ) : (
          <>
            {/* Status Section */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:col-span-8 bg-surface-container-low p-10 rounded-[32px] border border-outline-variant/10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden h-[400px]"
            >
              {/* Pulsing indicator */}
              <div className="relative">
                 <div className="absolute inset-[-10px] rounded-full animate-ping opacity-10 bg-primary"></div>
                 <div className="w-32 h-32 rounded-full border-4 border-primary/10 flex items-center justify-center bg-surface-container-high/50 backdrop-blur-md relative z-10 shadow-inner">
                   <span className="material-symbols-outlined text-5xl text-primary animate-pulse">hourglass_top</span>
                 </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold text-on-surface">Physician Notified</h2>
                <div className="flex items-center justify-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                   <p className="font-label text-[10px] text-tertiary uppercase tracking-[0.2em] font-black">Encrypted Line Active</p>
                </div>
              </div>
            </motion.section>

            {/* Sidebar Details */}
            <div className="md:col-span-4 flex flex-col gap-6">
              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-container-low p-8 rounded-[32px] border border-outline-variant/10 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <p className="font-label text-[10px] text-outline uppercase tracking-widest">Protocol ID</p>
                  <p className="font-body text-xs font-mono text-primary font-bold break-all opacity-60">{doctorId?.slice(0, 24)}...</p>
                </div>
                <div className="pt-6 mt-6 border-t border-outline-variant/5">
                  <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-3">Status</p>
                  <p className="font-body text-sm text-on-surface font-bold">Waiting for clinical admission...</p>
                </div>
              </motion.section>

              <motion.section 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-tertiary/10 border border-tertiary/20 p-8 rounded-[32px] relative overflow-hidden"
              >
                <div className="relative z-10">
                  <p className="font-label text-[10px] text-tertiary uppercase tracking-widest mb-3 font-black">Clinical Tip</p>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed opacity-80 italic">
                    "Have your recent symptoms or medical history details ready. Your physician will review them during the session."
                  </p>
                </div>
              </motion.section>
            </div>

            {/* Bottom Status Ticker */}
            <motion.footer 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-12 bg-surface-container-high/40 border border-outline-variant/10 px-8 py-4 rounded-2xl flex items-center justify-between backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-label text-[9px] text-on-surface-variant uppercase tracking-[0.2em]">Network: Peer-to-Peer Secured</span>
              </div>
              <span className="font-label text-[9px] text-outline uppercase tracking-widest tabular-nums">NODE // {user?.publicId?.slice(0, 12)}</span>
            </motion.footer>
          </>
        )}
      </motion.div>
    </div>
  );
}
