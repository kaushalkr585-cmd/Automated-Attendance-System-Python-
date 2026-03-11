import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { getStudents } from '../api';
import { useBreakpoint } from '../hooks/useBreakpoint';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  borderColor: 'rgba(99,102,241,0.3)',
  borderWidth: 1, titleColor: '#F1F5F9', bodyColor: '#94A3B8',
};

const darkChart = (isMobile) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: tooltipStyle,
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: isMobile ? 9 : 11 }, maxRotation: isMobile ? 45 : 0 } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: isMobile ? 9 : 11 } }, beginAtZero: true },
  },
});

function ChartCard({ title, children, delay = 0, height }) {
  const { isMobile } = useBreakpoint();
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="glass gradient-border"
      style={{ padding: isMobile ? '16px' : '24px' }}
    >
      <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '16px' }}>{title}</h3>
      <div style={{ height: height || (isMobile ? '200px' : '260px') }}>
        {children}
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { isMobile, lg } = useBreakpoint();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    getStudents().then(d => setStudents(d.students || [])).catch(console.error);
  }, []);

  // Bar: per-student
  const perStudentData = {
    labels: students.map(s => isMobile ? (s.name?.split(' ')[0] || s.student_id) : (s.name || s.student_id)),
    datasets: [{
      label: 'Attendance',
      data: students.map(s => s.total_attendance || 0),
      backgroundColor: students.map((_, i) => `hsl(${240 + i * 30}, 70%, 60%)`),
      borderColor: students.map((_, i) => `hsl(${240 + i * 30}, 70%, 70%)`),
      borderWidth: 1, borderRadius: 6,
    }],
  };

  // Line: 7-day
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });
  const trendData = {
    labels: last7.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Daily', data: last7.map(day => students.filter(s => (s.last_attendance_time || '').startsWith(day)).length),
      borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)',
      pointBackgroundColor: '#22C55E', pointRadius: 4, tension: 0.4, fill: true,
    }],
  };

  // Doughnut: branch-wise
  const branchMap = {};
  students.forEach(s => { branchMap[s.branch || 'Unknown'] = (branchMap[s.branch || 'Unknown'] || 0) + (s.total_attendance || 0); });
  const branches = Object.keys(branchMap);
  const doughnutData = {
    labels: branches,
    datasets: [{ data: branches.map(b => branchMap[b]), backgroundColor: ['#6366F1','#22C55E','#06B6D4','#A855F7','#F59E0B','#EF4444'], borderColor: 'rgba(15,23,42,0.8)', borderWidth: 2, hoverOffset: 8 }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: isMobile ? 'bottom' : 'right', labels: { color: '#94A3B8', font: { size: 10 }, padding: 12, boxWidth: 10 } },
      tooltip: tooltipStyle,
    },
  };

  const opts = darkChart(isMobile);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: `60px ${isMobile ? '14px' : '24px'} 24px` }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <BarChart3 size={20} color="var(--primary)" />
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800 }} className="gradient-text">Analytics</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Visual attendance insights</p>
        </motion.div>

        {/* Top 2 charts: side by side on lg, stacked otherwise */}
        <div className="responsive-grid-2" style={{ marginBottom: '16px' }}>
          <ChartCard title="ATTENDANCE PER STUDENT" delay={0.1} height={isMobile ? '180px' : '260px'}>
            <Bar data={perStudentData} options={opts} />
          </ChartCard>
          <ChartCard title="BRANCH-WISE DISTRIBUTION" delay={0.2} height={isMobile ? '200px' : '260px'}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </ChartCard>
        </div>

        {/* Trend — full width */}
        <ChartCard title="7-DAY DAILY ATTENDANCE TREND" delay={0.3}>
          <Line data={trendData} options={{ ...opts, plugins: { ...opts.plugins, legend: { display: false } } }} />
        </ChartCard>
      </div>
    </motion.div>
  );
}
