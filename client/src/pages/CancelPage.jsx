// pages/CancelPage.jsx
// Customers can cancel an unassigned booking using their BRN.
// Assigned or completed bookings cannot be cancelled.

import { useState } from 'react';

export default function CancelPage() {
  const [brn, setBrn] = useState('');
  const [brnErr, setBrnErr] = useState('');
  const [booking, setBooking] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    setBrnErr(''); setBooking(null); setNotFound(false); setDone(false);
    if (!/^BRN\d{5}$/.test(brn.trim())) { setBrnErr('Enter a valid BRN, e.g. BRN00001.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/track/${brn.trim()}`);
      const data = await res.json();
      if (data.status === 'found') setBooking(data.booking);
      else setNotFound(true);
    } catch { setBrnErr('Could not reach server.'); }
    finally { setLoading(false); }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brn: booking.booking_ref }),
      });
      const data = await res.json();
      if (data.status === 'success') { setDone(true); setBooking(null); }
      else setBrnErr(data.message || 'Cancellation failed.');
    } catch { setBrnErr('Could not reach server.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <h2 className="section-title">Cancel a Booking</h2>

      <div className="card">
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          Only <strong>unassigned</strong> bookings can be cancelled. Once a driver has been assigned, please call us directly.
        </p>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Booking Reference Number</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <input type="text" value={brn} onChange={e => setBrn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="e.g. BRN00001" style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={handleLookup} disabled={loading}>
              {loading ? 'Looking up…' : 'Look Up'}
            </button>
          </div>
          {brnErr && <span className="error">{brnErr}</span>}
        </div>
      </div>

      {notFound && <div className="alert alert-error">No booking found for <strong>{brn}</strong>.</div>}

      {done && (
        <div className="alert alert-success">
          Booking <strong>{brn}</strong> has been successfully cancelled.
        </div>
      )}

      {booking && (
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 16, color: 'var(--navy)' }}>
            {booking.booking_ref}
          </div>

          <div className="grid-2" style={{ fontSize: 14, marginBottom: 20 }}>
            <div><span className="text-muted">Name: </span><strong>{booking.cname}</strong></div>
            <div><span className="text-muted">Phone: </span>{booking.phone}</div>
            <div><span className="text-muted">Date: </span>{booking.pickup_date} at {booking.pickup_time}</div>
            <div><span className="text-muted">Pickup: </span>{[booking.snumber, booking.stname, booking.sbname].filter(Boolean).join(' ')}</div>
            {booking.dsbname && <div><span className="text-muted">Destination: </span>{booking.dsbname}</div>}
            <div><span className="text-muted">Status: </span><span className={`badge badge-${booking.status}`}>{booking.status}</span></div>
          </div>

          {booking.status !== 'unassigned' ? (
            <div className="alert alert-error" style={{ marginTop: 0 }}>
              This booking is <strong>{booking.status}</strong> and cannot be cancelled online.
              {booking.status === 'assigned' && ` Driver ${booking.driver_name} has already been assigned.`}
            </div>
          ) : (
            <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff' }}
              onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
