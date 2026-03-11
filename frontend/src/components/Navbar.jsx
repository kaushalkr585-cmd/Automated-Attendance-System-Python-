import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ScanFace, Users, BarChart3, Settings, Cpu, Menu, X } from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';

const navItems = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scanner',   label: 'Scanner',   icon: ScanFace },
  { to: '/students',  label: 'Students',  icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin',     label: 'Admin',     icon: Settings },
];

export default function Navbar() {
  const { isMobile } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const linkStyle = (isActive) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: isMobile ? '14px 20px' : '8px 14px',
    borderRadius: isMobile ? '12px' : '10px',
    textDecoration: 'none',
    fontSize: isMobile ? '15px' : '13px', fontWeight: 500,
    transition: 'all 0.2s',
    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    color: isActive ? '#6366F1' : 'var(--text-muted)',
    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
    boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none',
  });

  return (
    <>
      {/* Nav bar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '60px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)', flexShrink: 0,
            }}>
              <Cpu size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em' }} className="gradient-text">FaceAI</div>
              {!isMobile && (
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>ATTENDANCE SYSTEM</div>
              )}
            </div>
          </div>

          {/* Desktop links */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => linkStyle(isActive)}>
                  <Icon size={14} />{label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} className="blink" />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Online</span>
              </div>
            )}

            {/* Hamburger */}
            {isMobile && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDrawerOpen(o => !o)}
                style={{
                  width: 38, height: 38, borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.1)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {drawerOpen ? <X size={18} color="var(--primary)" /> : <Menu size={18} color="var(--primary)" />}
              </motion.button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer overlay */}
      <div
        className={`nav-drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 99,
              width: '260px',
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(99,102,241,0.2)',
              padding: '80px 16px 24px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}
          >
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to} end={to === '/'}
                style={({ isActive }) => linkStyle(isActive)}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={18} />{label}
              </NavLink>
            ))}

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 10px #22C55E' }} className="blink" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Online</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
