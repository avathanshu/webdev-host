// App.jsx — CabsOnline React app root with routing

import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import BookingPage from './pages/BookingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import TrackPage from './pages/TrackPage.jsx';
import DriverPage from './pages/DriverPage.jsx';

function Header() {
  return (
    <header style={{
      background: 'var(--navy)',
      color: '#fff',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
    }}>
      <div style={{
        maxWidth: 1080, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 32,
      }}>
        <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>🚖</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: 1 }}>CabsOnline</span>
        </div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {[
            { to: '/', label: 'Book' },
            { to: '/track', label: 'Track' },
            { to: '/admin', label: 'Admin' },
            { to: '/driver', label: 'Driver' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              padding: '18px 14px',
              color: isActive ? 'var(--gold-light)' : 'rgba(255,255,255,0.75)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              borderBottom: isActive ? '2px solid var(--gold-light)' : '2px solid transparent',
              transition: 'all .15s',
              display: 'inline-block',
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/driver" element={<DriverPage />} />
      </Routes>
    </>
  );
}
