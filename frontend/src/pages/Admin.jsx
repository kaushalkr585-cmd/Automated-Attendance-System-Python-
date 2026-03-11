import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, Edit2, RefreshCw, Upload, X, Check, AlertTriangle } from 'lucide-react';
import { getStudents, addStudent, updateStudent, deleteStudent, generateEncodings } from '../api';
import { useBreakpoint } from '../hooks/useBreakpoint';

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="glass gradient-border"
        style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative', margin: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700 }} className="gradient-text">{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function StudentForm({ initial = {}, onSubmit, loading, isMobile }) {
  const [form, setForm] = useState({
    student_id:    initial.student_id    || '',
    name:          initial.name          || '',
    major:         initial.major         || '',
    branch:        initial.branch        || '',
    year:          initial.year          || 1,
    starting_year: initial.starting_year || new Date().getFullYear(),
    standing:      initial.standing      || 'Good',
  });
  const [image,   setImage]   = useState(null);
  const [preview, setPreview] = useState(initial.profile_image_url || '');
  const fileRef = useRef();

  const handleImg = (e) => { const f = e.target.files[0]; if (!f) return; setImage(f); setPreview(URL.createObjectURL(f)); };
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('image', image);
    onSubmit(fd, form.student_id);
  };

  const Field = ({ label, k, type = 'text', disabled }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 600 }}>{label}</label>
      <input type={type} value={form[k]} required disabled={disabled}
        onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
        style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none', opacity: disabled ? 0.5 : 1 }} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Image */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div onClick={() => fileRef.current?.click()}
          style={{ width: 64, height: 64, borderRadius: '50%', cursor: 'pointer', background: preview ? 'transparent' : 'rgba(99,102,241,0.1)', border: '2px dashed rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {preview ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={18} color="var(--primary)" />}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Student Photo</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Required for face recognition</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} style={{ display: 'none' }} />
      </div>

      {/* Fields — 2 col on wide, 1 col on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
        <Field label="STUDENT ID" k="student_id" disabled={!!initial.student_id} />
        <Field label="FULL NAME" k="name" />
        <Field label="MAJOR" k="major" />
        <Field label="BRANCH" k="branch" />
        <Field label="YEAR" k="year" type="number" />
        <Field label="STARTING YEAR" k="starting_year" type="number" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 600 }}>STANDING</label>
        <select value={form.standing} onChange={e => setForm(p => ({ ...p, standing: e.target.value }))}
          style={{ padding: '9px 12px', borderRadius: '10px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', outline: 'none' }}>
          <option value="Good">Good</option>
          <option value="Average">Average</option>
          <option value="Poor">Poor</option>
        </select>
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
        style={{ marginTop: '4px', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--primary), #818CF8)', color: 'white', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 0 18px rgba(99,102,241,0.4)', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Saving…' : 'Save Student'}
      </motion.button>
    </form>
  );
}

export default function Admin() {
  const { isMobile } = useBreakpoint();
  const [students,        setStudents]        = useState([]);
  const [showAdd,         setShowAdd]         = useState(false);
  const [editStudent,     setEditStudent]     = useState(null);
  const [formLoading,     setFormLoading]     = useState(false);
  const [encodingStatus,  setEncodingStatus]  = useState(null);
  const [encodingLoading, setEncodingLoading] = useState(false);
  const [toast,           setToast]           = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = () => getStudents().then(d => setStudents(d.students || [])).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleAdd = async (fd) => { setFormLoading(true); try { await addStudent(fd); showToast('Student added!'); setShowAdd(false); load(); } catch (e) { showToast(e.response?.data?.detail || 'Failed', 'error'); } finally { setFormLoading(false); } };
  const handleEdit  = async (fd, id) => { setFormLoading(true); try { await updateStudent(id, fd); showToast('Updated!'); setEditStudent(null); load(); } catch { showToast('Failed', 'error'); } finally { setFormLoading(false); } };
  const handleDelete = async (id) => { if (!confirm(`Delete ${id}?`)) return; try { await deleteStudent(id); showToast('Deleted'); load(); } catch { showToast('Failed', 'error'); } };
  const handleGenerate = async () => { setEncodingLoading(true); setEncodingStatus(null); try { const r = await generateEncodings(); setEncodingStatus(r); showToast(`Encoded ${r.encoded} students!`); } catch { showToast('Encoding failed', 'error'); } finally { setEncodingLoading(false); } };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: `60px ${isMobile ? '14px' : '24px'} 24px` }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: '22px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Settings size={20} color="var(--primary)" />
              <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800 }} className="gradient-text">Admin Controls</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Manage students and face encodings</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleGenerate} disabled={encodingLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              <RefreshCw size={14} className={encodingLoading ? 'spin-slow' : ''} />
              {isMobile ? 'Gen. Encodings' : 'Generate Encodings'}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--primary), #818CF8)', color: 'white', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 18px rgba(99,102,241,0.4)' }}>
              <Plus size={14} /> Add Student
            </motion.button>
          </div>
        </motion.div>

        {/* Encoding result */}
        <AnimatePresence>
          {encodingStatus && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass" style={{ padding: '12px 16px', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center', borderRadius: '12px', border: '1px solid rgba(6,182,212,0.3)' }}>
              <Check size={15} color="var(--cyan)" />
              <span style={{ fontSize: '13px', color: 'var(--cyan)', fontWeight: 600 }}>
                Encoded {encodingStatus.encoded} students | Failed: {encodingStatus.failed?.length || 0}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Student list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {students.map((s, i) => (
            <motion.div key={s.student_id}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.005 }}
              className="glass gradient-border"
              style={{ padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}
            >
              {/* Avatar */}
              {s.profile_image_url ? (
                <img src={s.profile_image_url} alt={s.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(99,102,241,0.4)', fontWeight: 700, color: 'white', fontSize: '17px' }}>
                  {s.name?.charAt(0)}
                </div>
              )}
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.student_id} · {s.branch} · Y{s.year}</div>
              </div>
              {/* Attendance badge */}
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.total_attendance} sessions</div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setEditStudent(s)}
                  style={{ width: 32, height: 32, borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={13} color="var(--primary)" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDelete(s.student_id)}
                  style={{ width: 32, height: 32, borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} color="#EF4444" />
                </motion.button>
              </div>
            </motion.div>
          ))}
          {students.length === 0 && (
            <div className="glass" style={{ padding: '50px', textAlign: 'center', borderRadius: '16px' }}>
              <AlertTriangle size={28} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No students yet. Add one above.</p>
            </div>
          )}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              style={{
                position: 'fixed', bottom: '20px', right: '16px', zIndex: 300,
                padding: '12px 18px', borderRadius: '12px', fontWeight: 600, fontSize: '13px',
                background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
                color: toast.type === 'error' ? '#EF4444' : 'var(--accent)',
                backdropFilter: 'blur(12px)', maxWidth: 'calc(100vw - 32px)',
              }}>{toast.type === 'error' ? '✗ ' : '✓ '}{toast.msg}</motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && <Modal title="Add New Student" onClose={() => setShowAdd(false)}><StudentForm onSubmit={handleAdd} loading={formLoading} isMobile={isMobile} /></Modal>}
        {editStudent && <Modal title="Edit Student" onClose={() => setEditStudent(null)}><StudentForm initial={editStudent} onSubmit={handleEdit} loading={formLoading} isMobile={isMobile} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
}
