import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    { to: '/specialized',     label: 'Specialized Care', icon: 'medical_information' },
    { to: '/mental-wellness', label: 'Mental Wellness', icon: 'self_improvement' },
    { to: '/sexual-health',   label: 'Sexual Health',   icon: 'health_and_safety'},
    { to: '/safe-haven',      label: 'Safe Haven',      icon: 'shield_with_heart'},
    { to: '/coaching',        label: 'IncogniCoach',    icon: 'diversity_1'      },
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

/* ── Single nav item with sliding indicator ───────────────────────────────── */
function NavItem({ item, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.to;

  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={
        `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative select-none
         ${isActive
           ? 'text-white font-bold'
           : 'text-white/40 hover:text-white'
         }`
      }
    >
      {/* Sliding background capsule active indicator */}
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl -z-10 shadow-sm"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      
      <span
        className={`material-symbols-outlined text-[18px] shrink-0 transition-colors duration-300
          ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`}
        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
      >
        {item.icon}
      </span>
      <span className="font-sans text-[12px] tracking-wide truncate">{item.label}</span>
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
    <div className="flex flex-col h-full bg-[#131313]/40 backdrop-blur-3xl border-r border-white/5 relative z-25">
      {/* Brand logo header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-md">
          <span
            className="material-symbols-outlined text-white text-base"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield_with_heart
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="font-sans text-xs font-black text-white tracking-[0.1em] uppercase truncate">
            IncogniCare
          </h1>
          <p className="font-mono text-[8px] text-white/40 uppercase tracking-[0.2em] font-semibold mt-0.5">
            {roleLabel} Enclave
          </p>
        </div>
      </div>

      {/* Navigation container */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
        {items.map(item => (
          <NavItem key={item.to} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Footer controls: Contact support, log out, user chip */}
      <div className="px-4 pb-6 pt-4 border-t border-white/5 space-y-1.5 shrink-0">
        <button
          onClick={() => {
            onClose?.();
            window.dispatchEvent(new Event('open-support'));
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all font-sans text-xs"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">help</span>
          <span className="font-sans text-[11px] tracking-wide">Support Line</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all font-sans text-xs border border-transparent hover:border-red-500/15"
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">logout</span>
          <span className="font-sans text-[11px] tracking-wide">De-authorize Session</span>
        </button>

        {/* Custom Luxury User Chip with breathing ring */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-white/5 bg-white/[0.02] border border-white/5 rounded-2xl relative group overflow-hidden">
          <div className="shrink-0 rounded-full overflow-hidden border border-white/20 shadow-sm relative z-10">
            <AvatarGenerator seed={user?.avatar || user?.publicId} size="sm" />
          </div>
          <div className="min-w-0 flex-1 relative z-10">
            <p className="font-sans text-xs font-bold text-white truncate leading-none">
              {user?.nickname || 'Anonymous'}
            </p>
            <p className="font-mono text-[8px] text-white/45 truncate mt-1">ID // {user?.publicId?.substring(0, 12)}...</p>
          </div>
          {/* Subtle hover background sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Sidebar Navigation component ─────────────────────────────────────── */
export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Full-screen paths shouldn't show top/bottom navigation on mobile
  const isFullScreen = ['/chat/', '/consult/', '/waiting-room/', '/rider'].some(p =>
    location.pathname.startsWith(p)
  );

  const role = user?.role || 'PATIENT';

  // Bottom Navigation Config based on Role
  const bottomNavItems = role === 'PATIENT' ? [
    { to: '/dashboard',       label: 'Home',       icon: 'home_health'      },
    { to: '/directory',       label: 'Consult',    icon: 'stethoscope'      },
    { to: '/safe-haven',      label: 'Safe Haven', icon: 'shield_with_heart'},
    { to: '/profile',         label: 'Profile',    icon: 'person'           },
  ] : [
    // Providers & Admins
    { to: role === 'DOCTOR' ? '/doctor-dashboard' :
          role === 'PHARMACY' ? '/pharmacy-dashboard' :
          role === 'RIDER' ? '/rider-dashboard' :
          role === 'LAB_SCIENTIST' ? '/lab-dashboard' :
          role === 'SARC_OFFICER' ? '/sarc-dashboard' :
          role === 'ADMIN' ? '/admin' : '/dashboard',
      label: 'Dashboard',
      icon: role === 'PHARMACY' ? 'medication' :
            role === 'RIDER' ? 'delivery_truck' :
            role === 'LAB_SCIENTIST' ? 'biotech' :
            role === 'SARC_OFFICER' ? 'shield_with_heart' :
            role === 'ADMIN' ? 'admin_panel_settings' : 'medical_services'
    },
    { to: '/profile',  label: 'Profile',  icon: 'person'   },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      {/* ── Desktop: Fixed sticky sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 h-screen sticky top-0 bg-[#131313] border-r border-white/5 z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile & Tablet Layout ── */}
      {!isFullScreen && (
        <>
          {/* Mobile top bar */}
          <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-5 bg-[#131313]/40 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-white text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_with_heart
              </span>
              <span className="font-sans text-xs font-black text-white uppercase tracking-wider">IncogniCare</span>
            </div>
            
            {/* Quick Actions (SOS & Panic/Exit) */}
            <div className="flex items-center gap-2">
              {role === 'PATIENT' && (
                <button
                  onClick={() => window.dispatchEvent(new Event('open-sos'))}
                  className="px-3.5 py-1.5 flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                  style={{ height: '32px' }}
                >
                  <span className="material-symbols-outlined text-sm">emergency</span>
                  <span className="font-mono text-[9px] font-bold tracking-widest uppercase">SOS</span>
                </button>
              )}
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.replace('https://weather.com');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white active:scale-95 transition-all"
                title="Quick Exit"
              >
                <span className="material-symbols-outlined text-[16px]">exit_to_app</span>
              </button>
            </div>
          </div>

          {/* Mobile spacer */}
          <div className="lg:hidden h-14 shrink-0" />

          {/* Mobile bottom floating glass navigation bar */}
          <nav className="fixed bottom-4 inset-x-4 h-16 bg-[#131313]/55 backdrop-blur-2xl border border-white/5 rounded-full lg:hidden flex justify-around items-center px-4 z-40 shadow-2xl">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full relative"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-white/40'
                    }`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className={`font-sans text-[8px] uppercase tracking-wider mt-0.5 transition-colors duration-300 ${
                    isActive ? 'text-white font-bold' : 'text-white/40'
                  }`}>
                    {item.label.split(' ')[0]}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-indicator"
                      className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
            
            {/* Drawer menu toggle button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${
                drawerOpen ? 'text-white' : 'text-white/40'
              }`}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: drawerOpen ? "'FILL' 1" : "'FILL' 0" }}
              >
                menu
              </span>
              <span className="font-sans text-[8px] uppercase tracking-wider mt-0.5">Menu</span>
            </button>
          </nav>
        </>
      )}

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-45 bg-[#131313]/60 backdrop-blur-md"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Slide-in sidebar panel */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-[#131313]"
            >
              <SidebarContent onClose={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
