import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarGenerator from './AvatarGenerator';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_CONFIG = {
  PATIENT:    { label: 'Client' },
  DOCTOR:     { label: 'Doctor' },
  PHARMACY:   { label: 'Pharmacy' },
  RIDER:      { label: 'Rider' },
  ADMIN:      { label: 'Admin' },
};

import { LayoutDashboard, Heart, Brain, Shield, User, Settings, ClipboardList, Truck, ShieldAlert, LogOut, HelpCircle, X, Menu } from 'lucide-react';

const ICONS = {
  dashboard:  <LayoutDashboard className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  heart:      <Heart className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  brain:      <Brain className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  shield:     <Shield className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  user:       <User className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  cog:        <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  orders:     <ClipboardList className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  truck:      <Truck className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  admin:      <ShieldAlert className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  logout:     <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  support:    <HelpCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  close:      <X className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
  menu:       <Menu className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />,
};

const nav = {
  PATIENT: [
    { to: '/dashboard',       label: 'Dashboard',      icon: ICONS.dashboard },
    { to: '/directory',       label: 'Directory',      icon: ICONS.user },
    { to: '/sexual-health',   label: 'Sexual Health',  icon: ICONS.heart },
    { to: '/mental-wellness', label: 'Mental Wellness', icon: ICONS.brain },
    { to: '/safe-haven',      label: 'Safe Haven',     icon: ICONS.shield },
    { to: '/sarc',            label: 'SARC Centre',    icon: ICONS.shield },
    { to: '/profile',         label: 'Profile',        icon: ICONS.user },
    { to: '/settings',        label: 'Settings',       icon: ICONS.cog },
  ],
  DOCTOR: [
    { to: '/doctor-dashboard',  label: 'Doctor Portal', icon: ICONS.dashboard },
    { to: '/profile',           label: 'Profile',       icon: ICONS.user },
    { to: '/settings',          label: 'Settings',      icon: ICONS.cog },
  ],
  PHARMACY: [
    { to: '/pharmacy-dashboard', label: 'Pharmacy',      icon: ICONS.orders },
    { to: '/profile',            label: 'Profile',       icon: ICONS.user },
    { to: '/settings',           label: 'Settings',      icon: ICONS.cog },
  ],
  RIDER: [
    { to: '/rider-dashboard',  label: 'Deliveries',    icon: ICONS.truck },
    { to: '/profile',          label: 'Profile',       icon: ICONS.user },
    { to: '/settings',         label: 'Settings',      icon: ICONS.cog },
  ],
  LAB_SCIENTIST: [
    { to: '/lab-dashboard',    label: 'Lab Dashboard', icon: ICONS.dashboard },
    { to: '/profile',          label: 'Profile',       icon: ICONS.user },
    { to: '/settings',         label: 'Settings',      icon: ICONS.cog },
  ],
  ADMIN: [
    { to: '/admin',    label: 'Admin',    icon: ICONS.admin },
    { to: '/profile',  label: 'Profile',  icon: ICONS.user },
    { to: '/settings', label: 'Settings', icon: ICONS.cog },
  ],
};

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
          isActive
            ? 'bg-[#EDE9FE] text-[#6D28D9]'
            : 'text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-[#6D28D9]' : 'text-[#A1A1AA]'}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = user?.role;
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.PATIENT;
  const items = nav[role] || nav.PATIENT;

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/auth');
  };

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-20 bg-white border-r border-[#E8E6E3]">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-[#F0EDED]">
          <span className="text-lg font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Incognihealth
          </span>
          <div className="mt-2">
            <span className="badge badge-violet text-[11px]">{roleConf.label}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {items.map(item => <NavItem key={item.to} item={item} />)}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[#F0EDED] space-y-0.5">
          <a
            href="mailto:ajimatimati@gmail.com"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-all"
          >
            {ICONS.support}
            Contact Support
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#52525B] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-all"
          >
            {ICONS.logout}
            Sign Out
          </button>

          <div className="flex items-center gap-3 px-3 pt-3 mt-1 border-t border-[#F0EDED]">
            <div className="shrink-0 rounded-full overflow-hidden ring-2 ring-[#EDE9FE]">
              <AvatarGenerator seed={user?.avatar || user?.publicId} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#18181B] truncate">{user?.nickname || 'Anonymous'}</p>
              <p className="text-xs text-[#A1A1AA] truncate">{user?.publicId}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile: top bar + drawer ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-[#E8E6E3] flex items-center justify-between px-4 h-14">
        <span className="text-base font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Incognihealth
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-[#71717A] hover:bg-[#F4F4F5] transition-colors"
          aria-label="Open menu"
        >
          {ICONS.menu}
        </button>
      </div>

      {/* Spacer so content clears the top bar */}
      <div className="lg:hidden h-14" />

      {/* Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-white flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-[#F0EDED]">
                <span className="text-lg font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Incognihealth
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-[#A1A1AA] hover:bg-[#F4F4F5] transition-colors"
                >
                  {ICONS.close}
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {items.map(item => (
                  <div key={item.to} onClick={() => setDrawerOpen(false)}>
                    <NavItem item={item} />
                  </div>
                ))}
              </nav>

              <div className="p-3 border-t border-[#F0EDED] space-y-0.5">
                <a
                  href="mailto:ajimatimati@gmail.com"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#52525B] hover:bg-[#F4F4F5] transition-all"
                >
                  {ICONS.support}
                  Contact Support
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-[#52525B] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-all"
                >
                  {ICONS.logout}
                  Sign Out
                </button>

                <div className="flex items-center gap-3 px-3 pt-3 mt-1 border-t border-[#F0EDED]">
                  <div className="shrink-0 rounded-full overflow-hidden ring-2 ring-[#EDE9FE]">
                    <AvatarGenerator seed={user?.avatar || user?.publicId} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#18181B] truncate">{user?.nickname || 'Anonymous'}</p>
                    <span className="badge badge-violet text-[10px]">{roleConf.label}</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
