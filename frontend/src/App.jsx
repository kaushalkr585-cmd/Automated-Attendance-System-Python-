import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import ScannerPage from './pages/Scanner';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Three.js particle field */}
        <ParticleBackground />

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/scanner"   element={<ScannerPage />} />
              <Route path="/students"  element={<Students />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin"     element={<Admin />} />
            </Routes>
          </AnimatePresence>
          <Footer />
        </div>
      </div>
    </BrowserRouter>
  );
}
