import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { getStudents } from '../api';
import { useBreakpoint } from '../hooks/useBreakpoint';

// Mobile card view for a single student
function StudentRowCard({ s, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="glass"
      style={{ padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Avatar */}
      {s.profile_image_url ? (
        <img src={s.profile_image_url} alt={s.name} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99,102,241,0.3)', fontWeight: 700, color: 'white', fontSize: '17px', flexShrink: 0 }}>
          {s.name?.charAt(0) || '?'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{s.name}</div>
        <div style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>{s.student_id}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.branch} · Year {s.year}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)' }}>{s.total_attendance ?? 0}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>sessions</div>
        <div style={{
          marginTop: '4px', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600,
          background: s.standing === 'Good' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${s.standing === 'Good' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
          color: s.standing === 'Good' ? 'var(--accent)' : '#F59E0B',
        }}>{s.standing || 'Good'}</div>
      </div>
    </motion.div>
  );
}

export default function Students() {
  const { isMobile, md } = useBreakpoint();
  const [students,    setStudents]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [sortField,   setSortField]   = useState('name');
  const [sortDir,     setSortDir]     = useState('asc');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getStudents().then(d => setStudents(d.students || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let data = [...students];
    if (search) data = data.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase())
    );
    if (branchFilter !== 'All') data = data.filter(s => s.branch === branchFilter);
    data.sort((a, b) => {
      const av = sortField === 'total_attendance' ? (a[sortField] ?? 0) : (a[sortField] || '');
      const bv = sortField === 'total_attendance' ? (b[sortField] ?? 0) : (b[sortField] || '');
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    setFiltered(data);
  }, [students, search, branchFilter, sortField, sortDir]);

  const branches = ['All', ...new Set(students.map(s => s.branch).filter(Boolean))];
  const handleSort = (field) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } };
  const SortIcon = ({ field }) => sortField === field ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: `60px ${isMobile ? '14px' : '24px'} 24px` }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Users size={20} color="var(--primary)" />
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800 }} className="gradient-text">Student Database</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} students</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass gradient-border"
          style={{ padding: '14px 16px', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '150px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, ID, branch…"
              style={{
                width: '100%', padding: '9px 10px 9px 32px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          {/* Branch pills — scroll on mobile */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0, paddingBottom: '2px' }}>
            {branches.map(b => (
              <button key={b} onClick={() => setBranchFilter(b)} style={{
                padding: '6px 12px', borderRadius: '99px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.2s',
                background: branchFilter === b ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: branchFilter === b ? 'white' : 'var(--text-muted)',
                boxShadow: branchFilter === b ? '0 0 14px rgba(99,102,241,0.4)' : 'none',
              }}>{b}</button>
            ))}
          </div>
        </motion.div>

        {/* Mobile: card list | Desktop: table */}
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Loading…</p>}
            {!loading && filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>No students found</p>}
            {filtered.map((s, i) => <StudentRowCard key={s.student_id} s={s} i={i} />)}
          </div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass gradient-border"
            style={{ overflow: 'hidden' }}
          >
            <div className="table-scroll-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {[
                      { label: 'PHOTO', field: null },
                      { label: 'NAME', field: 'name' },
                      { label: 'ID', field: 'student_id' },
                      { label: 'BRANCH', field: 'branch' },
                      { label: 'YR', field: 'year' },
                      { label: 'ATTENDANCE', field: 'total_attendance' },
                      { label: 'STATUS', field: null },
                    ].map(({ label, field }) => (
                      <th key={label} style={{ padding: '0' }}>
                        <div onClick={() => field && handleSort(field)}
                          style={{ padding: '11px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.12em', fontWeight: 700, cursor: field ? 'pointer' : 'default', color: sortField === field ? 'var(--primary)' : 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none', whiteSpace: 'nowrap' }}>
                          {label}<SortIcon field={field} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>}
                  {!loading && filtered.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students found</td></tr>}
                  {filtered.map((s, i) => (
                    <motion.tr key={s.student_id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ background: 'rgba(99,102,241,0.06)' }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '11px 14px' }}>
                        {s.profile_image_url ? (
                          <img src={s.profile_image_url} alt={s.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.3)' }} />
                        ) : (
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99,102,241,0.3)', fontSize: '14px', fontWeight: 700, color: 'white' }}>{s.name?.charAt(0) || '?'}</div>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: '13px' }}>{s.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>{s.student_id}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>{s.branch}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>Y{s.year}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', minWidth: '50px' }}>
                            <div style={{ height: '100%', borderRadius: '99px', width: `${Math.min(100, (s.total_attendance || 0) * 5)}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', minWidth: '20px', textAlign: 'right' }}>{s.total_attendance ?? 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600,
                          background: s.standing === 'Good' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          border: `1px solid ${s.standing === 'Good' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          color: s.standing === 'Good' ? 'var(--accent)' : '#F59E0B',
                        }}>{s.standing || 'Good'}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
