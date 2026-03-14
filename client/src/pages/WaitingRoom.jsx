import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';

const WaitingRoom = () => {
  const { doctorId } = useParams(); // Using the doctor's public ID to join their queue
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleAdmit = (data) => {
      // Doctor has admitted the patient to a Jitsi room
      if (data.roomId) {
        toast.success('Your doctor is ready.');
        navigate(`/consult/${data.roomId}`);
      }
    };

    socket.on('admit-patient', handleAdmit);

    return () => {
      socket.off('admit-patient', handleAdmit);
    };
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
      toast.success('Successfully joined the waiting room. The doctor has been notified.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-dots flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] glow-point opacity-40" style={{ '--glow-color': 'rgba(30, 64, 175, 0.3)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] glow-point opacity-40" style={{ '--glow-color': 'rgba(109, 40, 217, 0.2)' }} />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.15 } }
        }}
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10"
      >
        {!joined ? (
          <>
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="md:col-span-12 bento-glass p-10 rounded-3xl text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl" 
                style={{ background: 'linear-gradient(135deg, #1E40AF 0%, #6D28D9 100%)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <MapPin className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <h1 className="text-4xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Secure Admission
              </h1>
              <p className="text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
                You are entering the IncorgniHealth secure perimeter. Your consultation is end-to-end encrypted and isolated for maximum privacy.
              </p>
              <button 
                onClick={joinQueue}
                className="px-10 py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
              >
                Enter Virtual Clinic
              </button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Header Status */}
            <motion.div 
              variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
              className="md:col-span-8 bento-glass p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative w-32 h-32">
                 <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-500"></div>
                 <div className="relative w-full h-full border-2 border-blue-500/30 rounded-full flex items-center justify-center bg-blue-500/10 backdrop-blur-md">
                   <Clock className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Physician Notified</h2>
                <div className="flex items-center justify-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Secure Line Established</p>
                </div>
              </div>
            </motion.div>

            {/* Sidebar Details */}
            <div className="md:col-span-4 flex flex-col gap-4">
              <motion.div 
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                className="bento-glass p-6 rounded-3xl flex-1 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic ID</p>
                  <p className="text-xs font-mono text-blue-400 font-bold break-all">{doctorId}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Connection</p>
                  <p className="text-white font-bold text-sm">Waiting for admission...</p>
                </div>
              </motion.div>

              <motion.div 
                variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
                className="bg-indigo-600/20 border border-indigo-500/30 p-6 rounded-3xl"
              >
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Clinical Tip</p>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                  Have your identification and any current medication containers ready for the physician to review.
                </p>
              </motion.div>
            </div>

            {/* Bottom Status Ticker */}
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="md:col-span-12 bento-glass px-6 py-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Status: Operational</span>
              </div>
              <span className="text-[10px] font-mono text-slate-600">INC-HEALTH // NODE_{user?.publicId?.slice(0,6)}</span>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default WaitingRoom;
