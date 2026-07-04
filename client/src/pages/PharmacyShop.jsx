import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import api from '../api';

/* ── Product data ─────────────────────────────────────────────────────────── */
const PRODUCTS = [
  // Test Kits
  { id: 'kit-1', category: 'Test Kits', icon: 'science', name: 'Complete STI Panel', sub: 'HIV, Chlamydia, Gonorrhoea, Syphilis', price: 12500, badge: 'Popular', delivery: '2–3 days', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'kit-2', category: 'Test Kits', icon: 'biotech', name: 'HIV Rapid Test Kit', sub: 'Results in 15 minutes', price: 4500, delivery: '1–2 days', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'kit-3', category: 'Test Kits', icon: 'water_drop', name: 'Hepatitis B & C Combo', sub: 'Dual-antibody detection panel', price: 7200, delivery: '2–3 days', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
  // Prescriptions
  { id: 'rx-1', category: 'Prescriptions', icon: 'medication', name: 'PrEP (TDF/FTC)', sub: 'HIV Pre-Exposure Prophylaxis — 30-day supply', price: 18000, badge: 'Rx Required', delivery: '1–2 days', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'rx-2', category: 'Prescriptions', icon: 'pill', name: 'Emergency Contraception', sub: 'Levonorgestrel 1.5mg', price: 3500, delivery: 'Same day', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'rx-3', category: 'Prescriptions', icon: 'local_pharmacy', name: 'Antifungal Treatment', sub: 'Fluconazole 150mg (Rx-grade)', price: 2800, delivery: '1–2 days', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
  // Wellness
  { id: 'wl-1', category: 'Wellness', icon: 'spa', name: 'Vitamin D3 + K2 Combo', sub: '5000 IU · 90-day supply', price: 6500, delivery: '3–5 days', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 'wl-2', category: 'Wellness', icon: 'health_and_safety', name: 'Zinc + Selenium Bundle', sub: 'Immune and reproductive support', price: 4200, delivery: '3–5 days', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10' },
];

const CATEGORIES = ['All', 'Test Kits', 'Prescriptions', 'Wellness'];

/* ── Order bottom-sheet ── */
function OrderSheet({ product, onClose, onSuccess }) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/user/order', {
        deliveryAddress: address.trim(),
        itemName: product.name,
        price: product.price,
      });
      onSuccess(res.data.order.publicOrderId);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            key="order-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-[#010101]/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            key="order-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[91] rounded-t-[2.5rem] overflow-hidden"
          >
            <div className="bg-black/40 backdrop-blur-3xl border-t border-white/5 shadow-2xl bento-glass">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-0" />
              <form onSubmit={handleOrder} className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10`}>
                    <span className={`material-symbols-outlined text-xl text-white`} style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans text-base font-bold text-white">{product.name}</h3>
                    <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest font-semibold">₦{product.price.toLocaleString()} · {product.delivery} delivery</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">Discreet Delivery Protocol</p>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">Plain, unmarked parcel wrapping. No company branding, no clinical text, no prescription details. Verified, de-identified delivery transit.</p>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[8px] uppercase tracking-widest text-white/40" htmlFor="delivery-address">Transit Destination Address</label>
                  <textarea
                    id="delivery-address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter complete delivery coordinates..."
                    className="input-field h-24 py-3 text-xs resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 h-11 rounded-full border border-white/10 text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-widest transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!address.trim() || loading}
                    className="flex-1 h-11 rounded-full bg-white text-black font-sans font-bold text-xs uppercase tracking-wider disabled:opacity-20 hover:bg-white/95 active:scale-95 transition-all flex items-center justify-center gap-2 shadow"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border border-black/25 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">package_2</span>
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Product card ── */
function ProductCard({ product, onOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-white/15 hover:shadow-lg transition-all duration-300 group bento-glass`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-white`}>
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
          </div>
          {product.badge && (
            <span className="font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white font-semibold">
              {product.badge}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-sans text-base font-bold text-white mb-1">{product.name}</h3>
          <p className="font-sans text-xs text-white/50 leading-relaxed">{product.sub}</p>
        </div>
        <div className="flex items-center gap-2.5 text-white/30">
          <span className="material-symbols-outlined text-sm">local_shipping</span>
          <span className="font-mono text-[8px] uppercase tracking-wider font-semibold">{product.delivery} · Discreet Package</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="font-sans text-lg font-black text-white">₦{product.price.toLocaleString()}</span>
        <button
          onClick={() => onOrder(product)}
          className={`h-9 px-5 rounded-full bg-white text-black font-sans font-bold text-[10px] uppercase tracking-wider hover:bg-white/95 active:scale-95 transition-all shadow`}
        >
          Order
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function PharmacyShop() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderProduct, setOrderProduct] = useState(null);
  const toast = useToast();

  const filtered = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

  const handleSuccess = (ref) => {
    toast.success(`Order placed! Reference: ${ref}. Delivery tracking active.`);
  };

  return (
    <div className="bg-[#010101] text-white min-h-screen select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14 space-y-10">

        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
            </div>
            <div>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold mb-0.5">Discreet Dispensary</p>
              <h1 className="font-sans text-3xl lg:text-4xl font-black text-white tracking-tight">Pharmacy</h1>
            </div>
          </div>
          <p className="font-sans text-xs text-white/50 leading-relaxed max-w-2xl">
            Request test kits, prescriptions, and wellness support products dispatched under de-identified transit parameters. Rx products require an active consultation record.
          </p>
        </header>

        {/* Delivery promise banner */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'package_2', label: 'Plain Packaging', sub: 'No clinical branding on the parcel' },
            { icon: 'lock', label: 'Encrypted Order Payload', sub: 'Purchase records decoupled from identity' },
            { icon: 'local_shipping', label: 'De-identified Delivery', sub: 'Real-time de-identified rider logs' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 bento-glass">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              <div>
                <p className="font-sans text-xs font-bold text-white">{f.label}</p>
                <p className="font-mono text-[8px] text-white/40 uppercase tracking-wider font-semibold mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 h-9 px-5 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? 'bg-white text-black font-bold shadow'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onOrder={setOrderProduct} />
          ))}
        </div>

        {/* Rx note */}
        <p className="text-center font-mono text-[8px] text-white/30 uppercase tracking-widest font-semibold pb-4">
          Items marked "Rx Required" require physician authorization before packaging.
        </p>
      </div>

      <OrderSheet product={orderProduct} onClose={() => setOrderProduct(null)} onSuccess={handleSuccess} />
    </div>
  );
}
