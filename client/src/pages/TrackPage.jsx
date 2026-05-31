// pages/TrackPage.jsx
// Customers enter a BRN to see their booking status with a visual timeline.

import { useState } from 'react';

const STAGES = [
  { key: 'received',   label: 'Booking Received',   sub: 'Your request has been logged in our system.' },
  { key: 'unassigned', label: 'Awaiting Assignment', sub: 'We are finding the nearest available driver.' },
  { key: 'assigned',   label: 'Driver Assigned',     sub: 'A driver has been allocated to your booking.' },
  { key: 'completed',  label: 'Trip Completed',      sub: 'Your journey is complete. Thank you!' },
];

function stageIndex(status) {
  if (status === 'unassigned') return 1;
  if (status === 'assigned')   return 2;
  if (status === 'completed')  return 3;
  return 0;
}

function Timeline({ status }) {
  const current = stageIndex(status);
  return (
    <ul className="timeline">
      {STAGES.map((stage, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <li key={stage.key}>
            <div className={`tl-dot ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              {done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <div className="tl-body">
              <div className="tl-label" style={{ color: (done || active) ? 'var(--navy)' : 'var(--muted)' }}>
                {stage.label}
              </div>
              {(done || active) && <div className="tl-sub">{stage.sub}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function TrackPage() {
  const [brn, setBrn] = useState('');
  const [brnErr, setBrnErr] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleTrack() {
    setBrnErr('');
    setResult(null);
    setNotFound(false);
    if (!/^BRN\d{5}$/.test(brn.trim())) {
      setBrnErr('Enter a valid BRN, e.g. BRN00001.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/track/${brn.trim()}`);
      const data = await res.json();
      if (data.status === 'found') setResult(data.booking);
      else setNotFound(true);
    } catch {
      setBrnErr('Could not reach server.');
    } finally {
      setLoading(false);
    }
  }

  const b = result;

  return (
    <div className="page">
      <h2 className="section-title">Track Your Booking</h2>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Booking Reference Number</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <input
              type="text"
              value={brn}
              onChange={e => setBrn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              placeholder="e.g. BRN00001"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleTrack} disabled={loading}>
              {loading ? 'Searching…' : 'Track'}
            </button>
          </div>
          {brnErr && <span className="error">{brnErr}</span>}
        </div>
      </div>

      {notFound && (
        <div className="alert alert-error">
          No booking found for <strong>{brn}</strong>. Please check the reference number.
        </div>
      )}

      {b && (
        <div className="card">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--navy)' }}>
                {b.booking_ref}
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>Booked {b.booking_datetime ? new Date(b.booking_datetime).toLocaleString('en-NZ') : ''}</div>
            </div>
            <span className={`badge badge-${b.status}`} style={{ fontSize: 13, padding: '5px 14px' }}>{b.status}</span>
          </div>

          {/* Details grid */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Passenger</div>
              <div style={{ fontWeight: 600 }}>{b.cname}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>{b.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Pickup</div>
              <div style={{ fontWeight: 600 }}>{b.pickup_date} at {b.pickup_time}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {[b.unumber, b.snumber, b.stname, b.sbname].filter(Boolean).join(' ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Destination</div>
              <div>{b.dsbname || <span className="text-muted">Not specified</span>}</div>
            </div>
            {b.driver_name && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>Driver</div>
                <div style={{ fontWeight: 600 }}>{b.driver_name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>{b.driver_id}</div>
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 16 }} />
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Journey Status</div>
          <Timeline status={b.status} />
        </div>
      )}
    </div>
  );
}
