import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import api from '../api';

/* ── Product data ─────────────────────────────────────────────────────────── */
const PRODUCTS = [
  // Test Kits
  { id: 'kit-1', category: 'Test Kits', icon: 'science', name: 'Complete STI Panel', sub: 'HIV, Chlamydia, Gonorrhoea, Syphilis', price: 12500, badge: 'Most Popular', delivery: '2–3 days', color: 'text-primary', bg: 'bg-primary/8', border: 'border-primary/20' },
  { id: 'kit-2', category: 'Test Kits', icon: 'biotech', name: 'HIV Rapid Test Kit', sub: 'Results in 15 minutes', price: 4500, delivery: '1–2 days', color: 'text-tertiary', bg: 'bg-tertiary/8', border: 'border-tertiary/20' },
  { id: 'kit-3', category: 'Test Kits', icon: 'water_drop', name: 'Hepatitis B & C Combo', sub: 'Dual-antibody detection panel', price: 7200, delivery: '2–3 days', color: 'text-secondary', bg: 'bg-secondary/8', border: 'border-secondary/20' },
  // Prescriptions
  { id: 'rx-1', category: 'Prescriptions', icon: 'medication', name: 'PrEP (TDF/FTC)', sub: 'HIV Pre-Exposure Prophylaxis — 30-day supply', price: 18000, badge: 'Rx Required', delivery: '1–2 days', color: 'text-primary', bg: 'bg-primary/8', border: 'border-primary/20' },
  { id: 'rx-2', category: 'Prescriptions', icon: 'pill', name: 'Emergency Contraception', sub: 'Levonorgestrel 1.5mg', price: 3500, delivery: 'Same day', color: 'text-error', bg: 'bg-error/8', border: 'border-error/20' },
  { id: 'rx-3', category: 'Prescriptions', icon: 'local_pharmacy', name: 'Antifungal Treatment', sub: 'Fluconazole 150mg (Rx-grade)', price: 2800, delivery: '1–2 days', color: 'text-tertiary', bg: 'bg-tertiary/8', border: 'border-tertiary/20' },
  // Wellness
  { id: 'wl-1', category: 'Wellness', icon: 'spa', name: 'Vitamin D3 + K2 Combo', sub: '5000 IU · 90-day supply', price: 6500, delivery: '3–5 days', color: 'text-secondary', bg: 'bg-secondary/8', border: 'border-secondary/20' },
  { id: 'wl-2', category: 'Wellness', icon: 'health_and_safety', name: 'Zinc + Selenium Bundle', sub: 'Immune and reproductive support', price: 4200, delivery: '3–5 days', color: 'text-tertiary', bg: 'bg-tertiary/8', border: 'border-tertiary/20' },
];

const CATEGORIES = ['All', 'Test Kits', 'Prescriptions', 'Wellness'];

/* ── Order bottom-sheet ────────────────────────────────────────────────────── */
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
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="order-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-[91] rounded-t-3xl overflow-hidden"
          >
            <div className="bg-background border-t border-outline-variant/20 shadow-2xl">
              <div className="w-12 h-1 bg-outline-variant/30 rounded-full mx-auto mt-4 mb-0" />
              <form onSubmit={handleOrder} className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${product.bg}`}>
                    <span className={`material-symbols-outlined text-xl ${product.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline text-base font-bold text-on-surface">{product.name}</h3>
                    <p className="font-label text-[10px] text-outline uppercase tracking-widest">₦{product.price.toLocaleString()} · {product.delivery} delivery</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-1">
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest">Discreet Delivery Guarantee</p>
                  <p className="font-body text-xs text-on-surface-variant">Plain, unmarked packaging. No brand name, no medical indicator on the parcel. Delivered by a verified IncogniCare rider.</p>
                </div>

                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline" htmlFor="delivery-address">Delivery Address</label>
                  <textarea
                    id="delivery-address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your full delivery address (stays private on your device only)"
                    className="w-full h-24 bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl border border-outline-variant/20 text-on-surface-variant font-label text-[10px] uppercase tracking-widest">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!address.trim() || loading}
                    className="flex-2 min-w-[160px] h-12 rounded-2xl bg-primary text-on-primary font-headline font-bold text-[12px] uppercase tracking-widest disabled:opacity-30 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Placing…</>
                      : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span> Place Order</>
                    }
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

/* ── Product card ─────────────────────────────────────────────────────────── */
function ProductCard({ product, onOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-container-low border ${product.border} rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all group`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl ${product.bg} flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-xl ${product.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{product.icon}</span>
          </div>
          {product.badge && (
            <span className="font-label text-[8px] uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {product.badge}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-headline text-base font-bold text-on-surface mb-1">{product.name}</h3>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-80">{product.sub}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline text-sm">local_shipping</span>
          <span className="font-label text-[10px] text-outline uppercase tracking-wide">{product.delivery} · Discreet packaging</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="font-headline text-xl font-black text-on-surface">₦{product.price.toLocaleString()}</span>
        <button
          onClick={() => onOrder(product)}
          className={`h-10 px-5 rounded-xl ${product.bg} ${product.color} border ${product.border} font-label text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all group-hover:shadow-md`}
        >
          Order
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function PharmacyShop() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderProduct, setOrderProduct] = useState(null);
  const toast = useToast();

  const filtered = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);

  const handleSuccess = (ref) => {
    toast.success(`Order placed! Reference: ${ref}. Delivery tracking coming soon.`);
  };

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">

        {/* Header */}
        <header>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
            <div>
              <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Discreet Delivery</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Pharmacy</h1>
            </div>
          </div>
          <p className="font-body text-sm text-on-surface-variant mt-2 max-w-2xl">
            Medications, test kits, and wellness products delivered in plain, unmarked packaging. Prescription items require a valid consultation on record.
          </p>
        </header>

        {/* Delivery promise banner */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'package_2', label: 'Plain Packaging', sub: 'No brand on the parcel' },
            { icon: 'lock', label: 'Encrypted Order', sub: 'Your purchase stays private' },
            { icon: 'local_shipping', label: 'Tracked Delivery', sub: 'Real-time rider updates' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              <div>
                <p className="font-headline text-sm font-bold text-on-surface">{f.label}</p>
                <p className="font-label text-[10px] text-outline uppercase tracking-wide">{f.sub}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 h-10 px-5 rounded-full font-label text-[11px] uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/15'
                  : 'bg-surface-container-low border border-outline-variant/15 text-on-surface-variant hover:text-on-surface'
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
        <p className="text-center font-body text-xs text-outline/50 pb-4">
          Items marked "Rx Required" will be verified against your consultation records before dispatch. Questions? Contact support.
        </p>
      </div>

      <OrderSheet product={orderProduct} onClose={() => setOrderProduct(null)} onSuccess={handleSuccess} />
    </div>
  );
}
