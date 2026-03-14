import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import AvatarGenerator from '../components/AvatarGenerator';
import { Star, CheckCircle2, ChevronRight } from 'lucide-react';

const QUESTIONS = [
  { id: 'q1', label: 'Clarity & Communication',    hint: 'Did the physician explain things clearly?' },
  { id: 'q2', label: 'Empathy & Bedside Manner',   hint: 'Did you feel heard and understood?' },
  { id: 'q3', label: 'Privacy & Discretion',        hint: 'Was your anonymity fully protected?' },
  { id: 'q4', label: 'Professionalism',             hint: 'Was the interaction conducted with care and expertise?' },
  { id: 'q5', label: 'Overall Satisfaction',        hint: 'How would you rate the entire experience?' },
];

const StarRow = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="group focus:outline-none"
      >
        <Star
          className={`w-8 h-8 transition-all duration-100 group-hover:scale-110 ${
            star <= value
              ? 'fill-[#D97706] text-[#D97706]'
              : 'text-[#E4E4E7] group-hover:text-[#FBD38D]'
          }`}
          strokeWidth={1.5}
        />
      </button>
    ))}
  </div>
);

const PostConsultationReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [answers, setAnswers]           = useState({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 });
  const [comment, setComment]           = useState('');

  useEffect(() => { fetchConsultation(); }, [id]);

  const fetchConsultation = async () => {
    try {
      const res = await api.get(`/consultation/${id}`);
      setConsultation(res.data);
    } catch {
      toast.error('Could not load session data.');
    } finally {
      setLoading(false);
    }
  };

  const answered = Object.values(answers).filter(v => v > 0).length;
  const allAnswered = answered === QUESTIONS.length;

  const submitReview = async () => {
    if (!allAnswered) {
      toast.error('Please rate all 5 dimensions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const vals = Object.values(answers);
      const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      await api.post(`/consultation/${id}/review`, { rating: avg, comment: comment.trim() || undefined });
      setSubmitted(true);
      toast.success('Feedback received — thank you.');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-dvh bg-[#F8F7F6] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* ── Submitted ── */
  if (submitted) return (
    <div className="min-h-dvh bg-[#F8F7F6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-[#E8E6E3] shadow-card rounded-2xl p-10 max-w-sm w-full flex flex-col items-center text-center gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#059669]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Evaluation Complete
          </h2>
          <p className="text-sm text-[#71717A] mt-2">
            Your feedback strengthens the quality of discreet care on Incognihealth.
          </p>
        </div>
        <span className="text-xs text-[#A1A1AA]">Redirecting you to your dashboard…</span>
      </motion.div>
    </div>
  );

  const doctor = consultation?.doctor;
  const avgSoFar = answered > 0
    ? (Object.values(answers).reduce((a, b) => a + b, 0) / answered).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="min-h-dvh bg-[#F8F7F6] py-8 px-4 lg:px-8 flex justify-center font-sans"
    >
      <div className="w-full max-w-2xl">

        {/* ── Page header ── */}
        <div className="mb-6">
          <p className="section-label mb-1">Post-Session Evaluation</p>
          <h1 className="text-3xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Rate your experience
          </h1>
          <p className="text-sm text-[#71717A] mt-1">Help us maintain discrete, expert care on the network.</p>
        </div>

        {/* ── Doctor profile card ── */}
        <div className="bg-white border border-[#E8E6E3] shadow-card rounded-2xl p-5 mb-4 flex items-center gap-4">
          <AvatarGenerator seed={doctor?.publicId || 'doctor'} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="section-label mb-0.5">Your Physician</p>
            <p className="text-[16px] font-bold text-[#18181B] truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {doctor?.nickname || `Dr. ${doctor?.publicId?.slice(0, 6)}`}
            </p>
            <span className="inline-block mt-1 text-[11px] font-bold text-[#6D28D9] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
              {doctor?.specialization || 'Clinical Specialist'}
            </span>
          </div>
          {avgSoFar && (
            <div className="flex flex-col items-center shrink-0 bg-[#FEF3C7] px-3 py-2 rounded-xl">
              <Star className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
              <span className="text-[16px] font-black text-[#18181B] tabular-nums">{avgSoFar}</span>
            </div>
          )}
        </div>

        {/* ── Progress indicator ── */}
        <div className="bg-white border border-[#E8E6E3] shadow-card rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
          <div className="flex gap-1.5 flex-1">
            {QUESTIONS.map((q, i) => (
              <div key={q.id} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${answers[q.id] > 0 ? 'bg-[#6D28D9]' : 'bg-[#F4F4F5]'}`} />
            ))}
          </div>
          <span className="text-[11px] font-bold text-[#A1A1AA] tabular-nums shrink-0">{answered}/{QUESTIONS.length}</span>
        </div>

        {/* ── Questions ── */}
        <div className="space-y-3 mb-4">
          {QUESTIONS.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`bg-white border rounded-2xl p-5 shadow-card transition-colors duration-150 ${
                answers[q.id] > 0 ? 'border-[#C4B5FD]' : 'border-[#E8E6E3]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[14px] font-bold text-[#18181B]">{q.label}</p>
                  <p className="text-[12px] text-[#A1A1AA] mt-0.5">{q.hint}</p>
                </div>
                <StarRow
                  value={answers[q.id]}
                  onChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Remarks ── */}
        <div className="bg-white border border-[#E8E6E3] shadow-card rounded-2xl p-5 mb-6">
          <label className="block section-label mb-3">Additional Remarks <span className="text-[#A1A1AA] normal-case font-normal">(optional)</span></label>
          <textarea
            className="w-full h-28 bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl p-4 text-sm text-[#18181B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/10 resize-none transition-all"
            placeholder="Share anything else about your consultation experience…"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        {/* ── Submit ── */}
        <button
          onClick={submitReview}
          disabled={submitting || !allAnswered}
          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 ${
            allAnswered
              ? 'bg-[#18181B] text-white hover:bg-[#27272A] shadow-sm'
              : 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed'
          } disabled:opacity-60`}
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit Evaluation <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>

        {!allAnswered && (
          <p className="text-center text-[12px] text-[#A1A1AA] mt-3">
            Please rate all {QUESTIONS.length} dimensions to continue
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PostConsultationReview;
