import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import SarcLocator from '../components/SarcLocator';
import { Shield, Phone, MessageCircle, ChevronLeft } from 'lucide-react';

const Sarc = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen relative overflow-hidden bg-[#F8F7F6] text-[#18181B] font-sans pb-24"
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-[#E8E6E3] pb-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-white border border-[#E8E6E3] rounded-2xl flex items-center justify-center shadow-card-sm">
                <Shield className="w-8 h-8 text-[#6D28D9]" strokeWidth={2} />
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Sexual Assault Referral Centre
              </h1>
            </div>
            <p className="section-label max-w-md normal-case leading-relaxed">
              Find verified SARC locations near you or connect immediately with a professional trauma counsellor.
            </p>
          </div>
          <RippleButton variant="secondary" onClick={() => navigate('/dashboard')} className="mt-6 md:mt-0 shadow-sm border border-[#E8E6E3] min-w-max">
            <ChevronLeft className="w-5 h-5 mr-1" strokeWidth={2} /> Return safely
          </RippleButton>
        </header>

        {/* Counsellor Contact Section */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E6E3] shadow-card-sm mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-[#18181B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#6D28D9]">
                <Phone className="w-4 h-4" strokeWidth={2.5} />
              </span>
              Immediate Counsellor Support
            </h2>
            <p className="text-[14px] text-[#71717A] mt-2">
              Speak confidentially to a trained trauma counsellor. We are here to support you 24/7.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="tel:08140432362" className="flex items-center justify-center gap-3 p-4 rounded-xl font-black transition-all bg-[#18181B] text-white hover:bg-[#27272A] shadow-sm">
              <Phone className="w-5 h-5" strokeWidth={2.5} /> Call 0814 043 2362
            </a>
            <a href="https://wa.me/2348140432362" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-xl font-black transition-all bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] hover:bg-[#D1FAE5] shadow-sm">
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} /> WhatsApp Message
            </a>
          </div>
        </section>

        {/* SARC Locator Map */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
           <h2 className="text-xl font-black text-[#18181B] mb-5">Verified SARC Locator</h2>
           <SarcLocator />
        </section>

      </div>
    </motion.div>
  );
};

export default Sarc;
