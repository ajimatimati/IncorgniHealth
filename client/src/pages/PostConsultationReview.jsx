import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import api from '../api';
import AvatarGenerator from '../components/AvatarGenerator';

const QUESTIONS = [
  { id: 'q1', label: 'Clarity & Communication',  hint: 'Did the physician explain things clearly?' },
  { id: 'q2', label: 'Empathy & Care',            hint: 'Did you feel heard and understood?' },
  { id: 'q3', label: 'Privacy & Discretion',      hint: 'Was your anonymity fully maintained?' },
  { id: 'q4', label: 'Professionalism',           hint: 'Was the session conducted with care and expertise?' },
  { id: 'q5', label: 'Overall Satisfaction',      hint: 'How would you rate the entire experience?' },
];

function StarRow({ value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="group focus:outline-none"
        >
          <span
            className={`material-symbols-outlined text-3xl transition-all group-hover:scale-110 ${
              star <= value ? 'text-tertiary' : 'text-outline/30 group-hover:text-tertiary/50'
            }`}
            style={{ fontVariationSettings: star <= value ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}

export default function PostConsultationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [answers, setAnswers]           = useState({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 });
  const [comment, setComment]           = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/consultation/${id}`);
        setConsultation(res.data);
      } catch { toast.error('Could not load session data.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const answered = Object.values(answers).filter(v => v > 0).length;
  const allAnswered = answered === QUESTIONS.length;

  const submitReview = async () => {
    if (!allAnswered) { toast.error('Please rate all areas before submitting.'); return; }
    setSubmitting(true);
    try {
      const vals = Object.values(answers);
      const avg  = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      await api.post(`/consultation/${id}/review`, { rating: avg, comment: comment.trim() || undefined });
      setSubmitted(true);
      toast.success('Thank you for your feedback.');
      setTimeout(() => navigate('/dashboard'), 2800);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-outline-variant/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (submitted) return (
    <div className="bg-background min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-12 max-w-sm w-full flex flex-col items-center text-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-tertiary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-tertiary" style={{ fontVariationSettings:"'FILL' 1" }}>check_circle</span>
        </div>
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">Review Submitted</h2>
          <p className="font-body text-sm text-on-surface-variant mt-2 leading-relaxed">
            Your feedback helps us provide better, more private care to everyone on the platform.
          </p>
        </div>
        <span className="font-label text-[9px] text-outline uppercase tracking-widest animate-pulse">Returning to dashboard...</span>
      </motion.div>
    </div>
  );

  const doctor = consultation?.doctor;
  const avgSoFar = answered > 0
    ? (Object.values(answers).reduce((a, b) => a + b, 0) / answered).toFixed(1)
    : null;

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="px-4 sm:px-6 lg:px-10 max-w-xl mx-auto py-8 lg:py-10 space-y-6">
        {/* Page Header */}
        <header>
          <p className="font-label text-[11px] text-outline uppercase tracking-[0.2em]">Post-Session</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Rate Your Experience</h1>
        </header>
        {/* Doctor Card */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 flex items-center gap-4">
          <AvatarGenerator seed={doctor?.publicId || 'doctor'} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-label text-[8px] text-outline uppercase tracking-widest mb-1">Your Physician</p>
            <p className="font-headline text-base font-bold text-on-surface truncate">
              {doctor?.nickname || `Dr. ${doctor?.publicId?.slice(0, 6)}`}
            </p>
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 font-label text-[8px] text-primary uppercase tracking-widest">
              {doctor?.specialization || 'Clinical Specialist'}
            </span>
          </div>
          {avgSoFar && (
            <div className="flex flex-col items-center shrink-0 px-3 py-2 rounded-xl bg-tertiary/10 border border-tertiary/20">
              <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings:"'FILL' 1" }}>star</span>
              <span className="font-headline text-lg font-black text-on-surface tabular-nums">{avgSoFar}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="flex gap-1.5 flex-1">
            {QUESTIONS.map(q => (
              <div key={q.id} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${answers[q.id] > 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
            ))}
          </div>
          <span className="font-label text-[10px] text-outline tabular-nums shrink-0">{answered}/{QUESTIONS.length}</span>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {QUESTIONS.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`bg-surface-container-low border rounded-2xl p-5 transition-all ${
                answers[q.id] > 0 ? 'border-primary/30' : 'border-outline-variant/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-headline text-sm font-bold text-on-surface">{q.label}</p>
                  <p className="font-body text-xs text-on-surface-variant mt-0.5 opacity-70">{q.hint}</p>
                </div>
                <StarRow value={answers[q.id]} onChange={val => setAnswers(prev => ({ ...prev, [q.id]: val }))} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comments */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5">
          <label className="font-label text-[9px] text-outline uppercase tracking-widest block mb-3">
            Additional Remarks <span className="text-outline/50 normal-case tracking-normal lowercase">(optional)</span>
          </label>
          <textarea
            className="w-full h-28 bg-surface-container border border-outline-variant/10 rounded-2xl p-4 text-sm text-on-surface placeholder:text-outline focus:border-primary/40 focus:outline-none resize-none transition-all"
            placeholder="Share any other thoughts about your session..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={submitReview}
          disabled={submitting || !allAnswered}
          className="w-full btn-primary h-14 disabled:opacity-30"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>

        {!allAnswered && (
          <p className="text-center font-label text-[9px] text-outline uppercase tracking-widest">
            Please rate all {QUESTIONS.length} areas to continue
          </p>
        )}
      </div>
    </div>
  );
}
