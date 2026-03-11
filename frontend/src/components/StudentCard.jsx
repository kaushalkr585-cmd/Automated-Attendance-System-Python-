import { motion } from 'framer-motion';
import { CheckCircle, Clock, User, BookOpen, Calendar, TrendingUp } from 'lucide-react';

export default function StudentCard({ student, isNew = true }) {
  if (!student) return null;

  return (
    <motion.div
      initial={isNew ? { scale: 0.7, opacity: 0, y: 30 } : {}}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.7, opacity: 0, y: 30 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="glass gradient-border"
      style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Success ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: '16px',
          border: '2px solid var(--accent)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          {student.profile_image_url ? (
            <img
              src={student.profile_image_url}
              alt={student.name}
              style={{
                width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid var(--accent)',
                boxShadow: '0 0 20px var(--accent-glow)',
              }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <User size={32} color="white" />
            </div>
          )}
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--accent)',
              borderRadius: '50%', padding: '2px',
            }}
          >
            <CheckCircle size={16} color="white" />
          </motion.div>
        </div>

        <div>
          <motion.h3
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}
            className="neon-text-accent"
          >
            {student.name}
          </motion.h3>
          <motion.p
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.1em' }}
          >
            ID: {student.student_id}
          </motion.p>
          <motion.div
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: '4px', display: 'inline-block',
              padding: '2px 10px', borderRadius: '99px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              fontSize: '11px', color: 'var(--accent)', fontWeight: 600,
            }}
          >
            ✓ ATTENDANCE MARKED
          </motion.div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { icon: BookOpen,    label: 'Branch',    value: student.branch || student.major },
          { icon: Calendar,    label: 'Year',      value: `Year ${student.year}` },
          { icon: TrendingUp,  label: 'Attendance', value: student.total_attendance },
          { icon: Clock,       label: 'Standing',  value: student.standing || 'Good' },
        ].map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}
          >
            <Icon size={14} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
