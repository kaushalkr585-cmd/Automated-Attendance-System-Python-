import { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Wifi, WifiOff, AlertCircle, Camera, RefreshCw } from 'lucide-react';
import StudentCard from '../components/StudentCard';
import { recognizeFace, markAttendance } from '../api';
import { useBreakpoint } from '../hooks/useBreakpoint';

const SCAN_INTERVAL = 2000;

async function dataURItoBlob(dataURI) {
  return (await fetch(dataURI)).blob();
}

function ScanOverlay({ faceBox, scanning, camWidth, camHeight }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '16px' }}>
      <div className="scan-grid" style={{ position: 'absolute', inset: 0, opacity: scanning ? 0.5 : 0.2, transition: 'opacity 0.4s' }} />
      <div className="scan-corner scan-corner-tl" />
      <div className="scan-corner scan-corner-tr" />
      <div className="scan-corner scan-corner-bl" />
      <div className="scan-corner scan-corner-br" />
      {scanning && <div className="scan-beam" />}

      {faceBox && camWidth > 0 && (
        <motion.div
          key={`${faceBox[0]}-${faceBox[1]}`}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{
            position: 'absolute',
            top:    `${(faceBox[0] / camHeight) * 100}%`,
            left:   `${(faceBox[3] / camWidth)  * 100}%`,
            width:  `${((faceBox[1] - faceBox[3]) / camWidth)  * 100}%`,
            height: `${((faceBox[2] - faceBox[0]) / camHeight) * 100}%`,
            border: '2px solid var(--accent)', borderRadius: '4px',
            boxShadow: '0 0 20px var(--accent-glow), inset 0 0 20px rgba(34,197,94,0.08)',
          }}
        >
          {['tl','tr','bl','br'].map(c => (
            <div key={c} style={{
              position: 'absolute', width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)',
              ...(c.includes('t') ? { top: -4 } : { bottom: -4 }),
              ...(c.includes('l') ? { left: -4 } : { right: -4 }),
            }} />
          ))}
        </motion.div>
      )}

      <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '9px', color: 'var(--accent)', letterSpacing: '0.12em', fontFamily: 'monospace' }}>
        {scanning ? '▸ SCANNING...' : faceBox ? '▸ FACE LOCKED' : '▸ READY'}
      </div>
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '9px', color: 'var(--primary)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
        AI v2.1 · HOG
      </div>
    </div>
  );
}

export default function ScannerPage() {
  const { isMobile, lg } = useBreakpoint();
  const webcamRef  = useRef(null);
  const [scanning,       setScanning]       = useState(false);
  const [status,         setStatus]         = useState('idle');
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [faceBox,        setFaceBox]        = useState(null);
  const [confidence,     setConfidence]     = useState(0);
  const [scanCount,      setScanCount]      = useState(0);
  const [backendOnline,  setBackendOnline]  = useState(null);
  const [camDims,        setCamDims]        = useState({ w: 640, h: 480 });
  const [lastError,      setLastError]      = useState('');
  const [manualLoading,  setManualLoading]  = useState(false);

  useEffect(() => {
    const check = () => fetch('/api/health').then(r => setBackendOnline(r.ok)).catch(() => setBackendOnline(false));
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  const handleUserMedia = () => {
    const video = webcamRef.current?.video;
    if (video) {
      const update = () => { if (video.videoWidth > 0) setCamDims({ w: video.videoWidth, h: video.videoHeight }); };
      video.addEventListener('loadedmetadata', update, { once: true });
      update();
    }
  };

  const doRecognize = useCallback(async () => {
    if (!webcamRef.current) return false;
    const imageSrc = webcamRef.current.getScreenshot({ width: 1280, height: 720 });
    if (!imageSrc) return false;
    setScanCount(c => c + 1);
    setStatus('scanning');
    setLastError('');
    try {
      const blob   = await dataURItoBlob(imageSrc);
      const result = await recognizeFace(blob);
      setFaceBox(result.face_locations?.length > 0 ? result.face_locations[0] : null);
      if (result.matched && result.student) {
        setConfidence(result.confidence);
        setMatchedStudent(result.student);
        setStatus('matched');
        setScanning(false);
        await markAttendance(result.student.student_id);
        return true;
      } else {
        setStatus(result.error ? 'error' : 'no_match');
        if (result.error) setLastError(result.error);
        setMatchedStudent(null);
        return false;
      }
    } catch (err) {
      setStatus('error');
      setLastError(err.message || 'Network error');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(doRecognize, SCAN_INTERVAL);
    return () => clearInterval(t);
  }, [scanning, doRecognize]);

  const startScan = () => { setMatchedStudent(null); setFaceBox(null); setStatus('idle'); setLastError(''); setScanning(true); };
  const stopScan  = () => { setScanning(false); setStatus('idle'); setFaceBox(null); };
  const handleManualCapture = async () => { setManualLoading(true); await doRecognize(); setManualLoading(false); };

  const statusConfig = {
    idle:     { color: 'var(--text-muted)', label: 'Ready to scan' },
    scanning: { color: 'var(--cyan)',       label: 'Scanning...' },
    matched:  { color: 'var(--accent)',     label: `Match — ${confidence.toFixed(1)}%` },
    no_match: { color: '#F59E0B',           label: 'Not recognised' },
    error:    { color: '#EF4444',           label: 'Error' },
  };
  const sc = statusConfig[status] || statusConfig.idle;
  const pad = isMobile ? '14px' : '24px';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', padding: `60px ${isMobile ? '14px' : '24px'} 24px` }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: '16px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800 }} className="gradient-text">Scanner</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>AI face recognition attendance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
              background: backendOnline ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${backendOnline ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: backendOnline ? 'var(--accent)' : '#EF4444',
            }}>
              {backendOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {backendOnline === null ? 'Connecting…' : backendOnline ? 'Online' : 'Offline'}
            </div>
            <div style={{ padding: '7px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--primary)' }}>
              <ScanFace size={12} style={{ display: 'inline', marginRight: '5px' }} />{scanCount} scans
            </div>
          </div>
        </motion.div>

        {/* Layout: stacks on mobile/tablet, side-by-side on desktop */}
        <div style={{ display: 'flex', flexDirection: lg ? 'row' : 'column', gap: '16px', alignItems: 'flex-start' }}>
          {/* Webcam */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass gradient-border"
            style={{ overflow: 'hidden', position: 'relative', borderRadius: '16px', flex: lg ? '1' : 'none', width: '100%' }}
          >
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg" screenshotQuality={0.96}
              mirrored onUserMedia={handleUserMedia}
              style={{ width: '100%', display: 'block', borderRadius: '16px' }}
              videoConstraints={{ facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }}
            />
            <ScanOverlay faceBox={faceBox} scanning={scanning} camWidth={camDims.w} camHeight={camDims.h} />
          </motion.div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: lg ? '360px' : '100%', flexShrink: 0 }}>
            {/* Status */}
            <motion.div initial={{ x: lg ? 30 : 0, y: lg ? 0 : 10, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }} className="glass gradient-border" style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '10px' }}>STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: sc.color }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: sc.color, boxShadow: `0 0 8px ${sc.color}`, flexShrink: 0 }} className={scanning ? 'blink' : ''} />
                {sc.label}
              </div>
              {status === 'error' && lastError && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#EF4444', background: 'rgba(239,68,68,0.08)', padding: '8px', borderRadius: '8px' }}>{lastError}</div>
              )}
              {status === 'no_match' && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#F59E0B', background: 'rgba(245,158,11,0.08)', padding: '8px', borderRadius: '8px' }}>
                  Try better lighting or re-generate encodings in Admin.
                </div>
              )}
              {status === 'matched' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Confidence</span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{confidence.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${confidence}%` }} transition={{ duration: 0.6 }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: '99px' }} />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Controls — horizontal row on mobile, vertical on desktop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="glass gradient-border" style={{ padding: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '10px' }}>CONTROLS</div>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={scanning ? stopScan : startScan} disabled={!backendOnline}
                  style={{
                    flex: isMobile ? 1 : 'none', padding: '11px 14px', borderRadius: '10px', border: scanning ? '1px solid rgba(239,68,68,0.3)' : 'none', cursor: 'pointer',
                    background: scanning ? 'rgba(239,68,68,0.15)' : (!backendOnline ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, var(--primary), #818CF8)'),
                    color: scanning ? '#EF4444' : 'white', fontWeight: 700, fontSize: '13px',
                    boxShadow: scanning || !backendOnline ? 'none' : '0 0 18px rgba(99,102,241,0.4)', transition: 'all 0.2s',
                  }}>
                  {scanning ? '■ Stop' : '▶ Auto-Scan'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleManualCapture} disabled={scanning || manualLoading || !backendOnline}
                  style={{
                    flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '11px 14px', borderRadius: '10px', cursor: 'pointer',
                    background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                    color: 'var(--cyan)', fontWeight: 600, fontSize: '13px', opacity: (scanning || manualLoading || !backendOnline) ? 0.5 : 1,
                  }}>
                  {manualLoading ? <><RefreshCw size={13} className="spin-slow" /> Scanning…</> : <><Camera size={13} /> Capture</>}
                </motion.button>
                {status === 'matched' && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={startScan}
                    style={{ flex: isMobile ? 1 : 'none', padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    ↺ Next
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Student card */}
            <AnimatePresence>
              {matchedStudent && <StudentCard key={matchedStudent.student_id} student={matchedStudent} />}
            </AnimatePresence>

            {status === 'no_match' && !matchedStudent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass" style={{ padding: '18px', textAlign: 'center', borderRadius: '12px' }}>
                <AlertCircle size={26} color="#F59E0B" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: '#F59E0B', fontWeight: 600, fontSize: '13px' }}>Face not recognised</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px' }}>Upload student photo and regenerate encodings in Admin.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
