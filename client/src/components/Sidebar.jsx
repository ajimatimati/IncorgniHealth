import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarGenerator from './AvatarGenerator';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Role labels ──────────────────────────────────────────────────────────── */
const ROLE_LABELS = {
  PATIENT:       'Patient',
  DOCTOR:        'Doctor',
  PHARMACY:      'Pharmacy',
  RIDER:         'Rider',
  LAB_SCIENTIST: 'Lab Scientist',
  SARC_OFFICER:  'SARC Officer',
  ADMIN:         'Admin',
};

/* ── Navigation config per role ───────────────────────────────────────────── */
const NAV = {
  PATIENT: [
    { to: '/dashboard',       label: 'Home',            icon: 'home_health'      },
    { to: '/directory',       label: 'Find a Doctor',   icon: 'stethoscope'      },
    { to: '/mental-wellness', label: 'Mental Wellness', icon: 'self_improvement' },
    { to: '/sexual-health',   label: 'Sexual Health',   icon: 'health_and_safety'},
    { to: '/safe-haven',      label: 'Safe Haven',      icon: 'shield_with_heart'},
    { to: '/profile',         label: 'My Profile',      icon: 'person'           },
    { to: '/settings',        label: 'Settings',        icon: 'settings'         },
  ],
  DOCTOR: [
    { to: '/doctor-dashboard', label: 'Doctor Portal',    icon: 'medical_services' },
    { to: '/profile',          label: 'My Profile',       icon: 'person'           },
    { to: '/settings',         label: 'Settings',         icon: 'settings'         },
  ],
  PHARMACY: [
    { to: '/pharmacy-dashboard', label: 'Order Pipeline', icon: 'medication'     },
    { to: '/profile',            label: 'My Profile',     icon: 'person'         },
    { to: '/settings',           label: 'Settings',       icon: 'settings'       },
  ],
  RIDER: [
    { to: '/rider-dashboard', label: 'Deliveries',   icon: 'delivery_truck'   },
    { to: '/profile',         label: 'My Profile',   icon: 'person'           },
    { to: '/settings',        label: 'Settings',     icon: 'settings'         },
  ],
  LAB_SCIENTIST: [
    { to: '/lab-dashboard', label: 'Lab Pipeline', icon: 'biotech'        },
    { to: '/profile',       label: 'My Profile',   icon: 'person'         },
    { to: '/settings',      label: 'Settings',     icon: 'settings'       },
  ],
  SARC_OFFICER: [
    { to: '/sarc-dashboard', label: 'SARC Portal', icon: 'shield_with_heart' },
    { to: '/profile',        label: 'My Profile',  icon: 'person'            },
    { to: '/settings',       label: 'Settings',    icon: 'settings'          },
  ],
  ADMIN: [
    { to: '/admin',    label: 'Admin Panel', icon: 'admin_panel_settings' },
    { to: '/profile',  label: 'My Profile',  icon: 'person'               },
    { to: '/settings', label: 'Settings',    icon: 'settings'             },
  ],
};

/* ── Single nav item ──────────────────────────────────────────────────────── */
function NavItem({ item, onClick }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative
         ${isActive
           ? 'bg-primary/10 text-primary border-l-2 border-primary ml-0 pl-[10px]'
           : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-2 border-transparent'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`material-symbols-outlined text-[18px] shrink-0 transition-all
              ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}
            style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
          >
            {item.icon}
          </span>
          <span className="font-label text-[13px] tracking-wide truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ── Sidebar content (shared between desktop & drawer) ──────────────────── */
function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'PATIENT';
  const items = NAV[role] || NAV.PATIENT;
  const roleLabel = ROLE_LABELS[role] || role;

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-outline-variant/10">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-outline-variant/10 shrink-0">
        <span
          className="material-symbols-outlined text-primary text-2xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          shield_with_heart
        </span>
        <div className="min-w-0">
          <h1 className="font-headline text-base font-bold text-on-surface tracking-wide truncate">
            IncogniHealth
          </h1>
          <p className="font-label text-[9px] text-primary uppercase tracking-[0.2em]">
            {roleLabel} Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {items.map(item => (
          <NavItem key={item.to} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Footer: support + logout + user chip */}
      <div className="px-3 pb-4 pt-3 border-t border-outline-variant/10 space-y-1 shrink-0">
        <button
          onClick={() => {
            onClose?.();
            window.dispatchEvent(new Event('open-support'));
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">help</span>
          <span className="font-label text-[13px]">Contact Support</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">logout</span>
          <span className="font-label text-[13px]">Sign Out</span>
        </button>

        {/* User chip */}
        <div className="flex items-center gap-3 px-3 pt-3 mt-1 border-t border-outline-variant/10">
          <div className="shrink-0 rounded-full overflow-hidden ring-2 ring-primary/20">
            <AvatarGenerator seed={user?.avatar || user?.publicId} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-headline text-sm font-semibold text-on-surface truncate">
              {user?.nickname || 'Anonymous'}
            </p>
            <p className="font-label text-[10px] text-outline truncate">{user?.publicId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Sidebar component ───────────────────────────────────────────────── */
export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* ── Desktop: fixed left sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-background/90 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield_with_heart
          </span>
          <span className="font-headline text-sm font-bold text-on-surface tracking-wide">IncogniHealth</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14 shrink-0" />

      {/* ── Mobile: slide-in drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50"
            >
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
