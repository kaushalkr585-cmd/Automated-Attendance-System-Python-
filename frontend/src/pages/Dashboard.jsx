import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, TrendingUp, Activity, Clock, Brain } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { getStudents, getStats } from '../api';
import { useBreakpoint } from '../hooks/useBreakpoint';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 25 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="glass gradient-border"
      style={{ padding: '16px', cursor: 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${color}30`, flexShrink: 0,
        }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} className="blink" />
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>{label}</div>
    </motion.div>
  );
}

function RecentActivity({ students, isMobile }) {
  const sorted = [...students]
    .filter(s => s.last_attendance_time)
    .sort((a, b) => new Date(b.last_attendance_time) - new Date(a.last_attendance_time))
    .slice(0, isMobile ? 4 : 6);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="glass gradient-border"
      style={{ padding: '20px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <Clock size={15} color="var(--primary)" />
        <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em' }}>RECENT ACTIVITY</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No records yet</p>
        )}
        {sorted.map((s, i) => (
          <motion.div
            key={s.student_id}
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * i }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white',
            }}>{s.name?.charAt(0) || '?'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.branch} · {s.last_attendance_time?.slice(0, 16)}</div>
            </div>
            <div style={{
              padding: '3px 8px', borderRadius: '99px', flexShrink: 0,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              fontSize: '10px', color: 'var(--accent)', fontWeight: 600,
            }}>✓</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { isMobile, lg } = useBreakpoint();
  const [stats, setStats]     = useState({});
  const [students, setStudents] = useState([]);

  useEffect(() => {
    Promise.all([getStats(), getStudents()])
      .then(([s, d]) => { setStats(s); setStudents(d.students || []); })
      .catch(console.error);
  }, []);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const dailyCounts = last7.map(day => students.filter(s => (s.last_attendance_time || '').startsWith(day)).length);

  const chartData = {
    labels: last7.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Attendance', data: dailyCounts,
      borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.1)',
      pointBackgroundColor: '#6366F1', pointBorderColor: '#fff', pointRadius: 4,
      tension: 0.4, fill: true,
    }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1 } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748B', font: { size: 10 }, stepSize: 1 }, beginAtZero: true },
    },
  };

  const recognition = stats.total_students > 0 ? `${Math.round((stats.today_attendance / stats.total_students) * 100)}%` : '—';
  const statCards = [
    { icon: Users,      label: 'Total Students',    value: stats.total_students,   color: '#6366F1', delay: 0 },
    { icon: UserCheck,  label: "Today's Attendance", value: stats.today_attendance, color: '#22C55E', delay: 0.08 },
    { icon: TrendingUp, label: 'Total Attendance',   value: stats.total_attendance, color: '#06B6D4', delay: 0.16 },
    { icon: Activity,   label: 'Recognition Rate',   value: recognition,            color: '#A855F7', delay: 0.24 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: `60px ${isMobile ? '14px' : '24px'} 24px` }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Brain size={22} color="var(--primary)" />
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800 }} className="gradient-text">AI Dashboard</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Real-time attendance insights</p>
        </motion.div>

        {/* Stats */}
        <div className="responsive-grid-4" style={{ marginBottom: '20px' }}>
          {statCards.map(c => <StatCard key={c.label} {...c} />)}
        </div>

        {/* Charts + Activity */}
        <div className={lg ? 'responsive-two-col' : ''} style={lg ? {} : { display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="glass gradient-border"
            style={{ padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={14} color="var(--primary)" />
              <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>7-DAY ATTENDANCE TREND</h3>
            </div>
            <div style={{ height: isMobile ? '180px' : '240px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          <RecentActivity students={students} isMobile={isMobile} />
        </div>
      </div>
    </motion.div>
  );
}
