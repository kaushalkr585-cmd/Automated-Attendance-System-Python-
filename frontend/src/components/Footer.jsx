import { motion } from 'framer-motion';
import { Heart, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(99, 102, 241, 0.15)',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '20px 16px',
        marginTop: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 22,
            height: 22,
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Cpu size={12} color="white" />
        </div>

        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            letterSpacing: '0.03em',
          }}
        >
          Made with
        </span>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.03em',
          }}
        >
          Kaushal Kumar
        </span>

        <span style={{ fontSize: '13px', color: 'rgba(148,163,184,0.4)' }}>
          ·
        </span>

        <span style={{ fontSize: '12px', color: 'rgba(148,163,184,0.4)' }}>
          FaceAI Attendance System © {new Date().getFullYear()}
        </span>
      </div>
    </motion.footer>
  );
}
