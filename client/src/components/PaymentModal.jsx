import { useState } from 'react';
import { useToast } from './Toast';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from './RippleButton';

const PaymentModal = ({ amount: initialAmount = 0, type = 'Wallet Top-up', payerId, payeeId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
  const toast = useToast();

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      // Mock network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await api.post('/payments/pay', { payerId, payeeId, amount: Number(amount), type });
      if (res.data.success || res.status === 200) {
        setSuccess(true);
        toast.success('Transaction Successful');
        setTimeout(() => {
          onSuccess(res.data?.transaction || { amount });
          onClose();
        }, 1500);
      } else {
        setError(res.data?.message || 'Transaction declined by issuer.');
      }
    } catch {
      setError('Something went wrong processing your payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const platformFee = Number(amount) * 0.05; // 5% for top-up
  const subtotal = Number(amount);
  const total = subtotal + platformFee;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#0f1219]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 rounded-lg"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-surface border border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden relative"
        >
          {/* Mock Paystack Header */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-white/5 p-6 text-center relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
             <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Secured by PayMock
             </p>
             <h3 className="text-text-muted text-sm">{type}</h3>
             <div className="text-3xl font-mono font-bold text-white mt-2">
               {'\u20A6'}{total.toLocaleString()}
             </div>
             <p className="text-text-dim text-xs mt-1">{payerId || 'user@example.com'}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Input Amount if initial was 0 */}
            {!initialAmount && (
              <div>
                <label className="text-xs text-text-muted mb-2 block uppercase tracking-wider">Top-up Amount ({'\u20A6'})</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                  placeholder="5000"
                  min="100"
                />
              </div>
            )}

            {/* Receipt Details */}
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Amount</span>
                <span className="text-text-secondary font-mono">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Processing Fee (5%)</span>
                <span className="text-text-secondary font-mono">₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-center">
                <span className="font-semibold text-text-primary text-sm">Charge me</span>
                <span className="font-bold text-lg text-emerald-400 font-mono">₦{total.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-shake">
                <p className="text-xs text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-3">
              <RippleButton
                onClick={handlePayment}
                disabled={loading || success || Number(amount) < 100}
                className="w-full justify-center py-3.5"
                style={{ backgroundColor: success ? '#10b981' : '#0ea5e9', color: 'white' }}
              >
                {success ? (
                   <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    Payment Approved
                   </span>
                ) : loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  `Pay ₦${total.toLocaleString()}`
                )}
              </RippleButton>
              <button 
                onClick={onClose} 
                disabled={loading || success} 
                className="text-xs text-text-muted hover:text-white transition py-2"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
