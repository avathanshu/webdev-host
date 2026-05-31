// pages/DashboardPage.jsx
// Live stats: booking counts by status, driver availability, recent activity feed.

import { useState, useEffect } from 'react';

function Stat({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)', padding: '20px 24px',
      borderTop: `3px solid ${color}`
    }}>
      <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function load() {
    const [bRes, dRes] = await Promise.all([
      fetch('/api/admin/all'),
      fetch('/api/drivers'),
    ]);
    setBookings(await bRes.json());
    setDrivers(await dRes.json());
    setLastRefresh(new Date());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const counts = {
    total:      bookings.length,
    unassigned: bookings.filter(b => b.status === 'unassigned').length,
    assigned:   bookings.filter(b => b.status === 'assigned').length,
    completed:  bookings.filter(b => b.status === 'completed').length,
    cancelled:  bookings.filter(b => b.status === 'cancelled').length,
  };

  const driversAvailable = drivers.filter(d => d.status === 'available').length;
  const recent = bookings.slice(0, 8); // already newest-first from API

  return (
    <div className="page-wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRefresh && <span className="text-muted" style={{ fontSize: 12 }}>Updated {lastRefresh.toLocaleTimeString('en-NZ')}</span>}
          <button className="btn btn-sm btn-outline" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Stat label="Total Bookings"  value={counts.total}      color="var(--navy)" />
        <Stat label="Unassigned"      value={counts.unassigned} color="#856404" />
        <Stat label="Assigned"        value={counts.assigned}   color="#0c5460" />
        <Stat label="Completed"       value={counts.completed}  color="var(--green)" />
        <Stat label="Cancelled"       value={counts.cancelled}  color="var(--red)" />
      </div>

      <div className="grid-2">
        {/* Driver status */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 14 }}>
            Drivers ({driversAvailable}/{drivers.length} available)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drivers.map(d => (
              <div key={d.driver_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>{d.vehicle}</span>
                </div>
                <span className={`badge badge-${d.status}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 14 }}>
            Recent Bookings
          </div>
          {recent.length === 0
            ? <p className="text-muted" style={{ fontSize: 14 }}>No bookings yet.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recent.map(b => (
                  <div key={b.booking_ref} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div>
                      <code style={{ fontWeight: 700, fontFamily: 'monospace' }}>{b.booking_ref}</code>
                      <span className="text-muted" style={{ marginLeft: 8 }}>{b.cname}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-muted">{b.pickup_date}</span>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}
