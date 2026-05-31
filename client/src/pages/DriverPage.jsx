// pages/DriverPage.jsx
// Driver interface: select your driver ID, see assigned jobs, mark complete.

import { useState, useEffect } from 'react';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function DriverPage() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [completing, setCompleting] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/drivers').then(r => r.json()).then(setDrivers);
  }, []);

  async function selectDriver(driver) {
    setSelectedDriver(driver);
    setMsg('');
    const res = await fetch(`/api/driver/${driver.driver_id}/jobs`);
    setJobs(await res.json());
  }

  async function completeJob(brn) {
    setCompleting(brn);
    await fetch(`/api/driver/${selectedDriver.driver_id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brn }),
    });
    setMsg(`Job ${brn} marked as completed.`);
    // refresh
    const res = await fetch(`/api/driver/${selectedDriver.driver_id}/jobs`);
    setJobs(await res.json());
    // refresh driver status
    const dRes = await fetch('/api/drivers');
    const updated = await dRes.json();
    setDrivers(updated);
    const me = updated.find(d => d.driver_id === selectedDriver.driver_id);
    if (me) setSelectedDriver(me);
    setCompleting(null);
  }

  const activeJobs = jobs.filter(j => j.status === 'assigned');
  const pastJobs   = jobs.filter(j => j.status === 'completed');

  return (
    <div className="page">
      <h2 className="section-title">Driver Portal</h2>

      {/* Driver selection */}
      {!selectedDriver ? (
        <div className="card">
          <p style={{ marginBottom: 16, color: 'var(--muted)', fontSize: 14 }}>
            Select your driver profile to view your assigned jobs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drivers.map(d => (
              <div key={d.driver_id} className="driver-card" style={{ cursor: 'pointer' }}
                onClick={() => selectDriver(d)}>
                <div className="driver-avatar">{d.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{d.vehicle} · {d.plate}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Driver header */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px' }}>
            <div className="driver-avatar" style={{ width: 52, height: 52, fontSize: '1.5rem' }}>
              {selectedDriver.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{selectedDriver.name}</div>
              <div className="text-muted" style={{ fontSize: 13 }}>{selectedDriver.vehicle} · {selectedDriver.plate} · {selectedDriver.driver_id}</div>
            </div>
            <StatusBadge status={selectedDriver.status} />
            <button className="btn btn-sm btn-outline" onClick={() => { setSelectedDriver(null); setJobs([]); setMsg(''); }}>
              Switch Driver
            </button>
          </div>

          {msg && <div className="alert alert-success">{msg}</div>}

          {/* Active jobs */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 14, color: 'var(--navy)' }}>
              Active Jobs ({activeJobs.length})
            </div>
            {activeJobs.length === 0
              ? <p className="text-muted" style={{ fontSize: 14 }}>No active jobs. Check back after the admin assigns a booking.</p>
              : activeJobs.map(j => (
                <div key={j.booking_ref} style={{
                  border: '1.5px solid var(--border)',
                  borderRadius: 6, padding: 16, marginBottom: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>{j.booking_ref}</div>
                      <div style={{ fontWeight: 600, marginTop: 4 }}>{j.cname}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>{j.phone}</div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => completeJob(j.booking_ref)}
                      disabled={completing === j.booking_ref}
                    >
                      {completing === j.booking_ref ? 'Completing…' : 'Mark Complete'}
                    </button>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                  <div className="grid-2" style={{ fontSize: 13 }}>
                    <div>
                      <span className="text-muted">Pickup: </span>
                      {[j.unumber, j.snumber, j.stname, j.sbname].filter(Boolean).join(' ')}
                    </div>
                    <div>
                      <span className="text-muted">Destination: </span>
                      {j.dsbname || 'Not specified'}
                    </div>
                    <div>
                      <span className="text-muted">Date/Time: </span>
                      {j.pickup_date} {j.pickup_time}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Past jobs */}
          {pastJobs.length > 0 && (
            <div className="card">
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 14, color: 'var(--navy)' }}>
                Completed Jobs ({pastJobs.length})
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Customer</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastJobs.map(j => (
                      <tr key={j.booking_ref}>
                        <td><code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{j.booking_ref}</code></td>
                        <td>{j.cname}</td>
                        <td>{j.sbname || '—'}</td>
                        <td>{j.dsbname || '—'}</td>
                        <td>{j.pickup_date} {j.pickup_time}</td>
                        <td><StatusBadge status={j.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
