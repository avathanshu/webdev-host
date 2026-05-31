// pages/AdminPage.jsx
// Admin dashboard: search by BRN or view upcoming unassigned, assign taxis,
// plus a full bookings overview table.

import { useState, useEffect } from 'react';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

function BookingTable({ bookings, onAssign, assignedBrn }) {
  if (!bookings || bookings.length === 0)
    return <p className="text-muted" style={{ marginTop: 12 }}>No bookings found.</p>;

  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Booking Ref</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Pickup Suburb</th>
            <th>Destination</th>
            <th>Date &amp; Time</th>
            <th>Status</th>
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.booking_ref}>
              <td><code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{b.booking_ref}</code></td>
              <td>{b.cname}</td>
              <td>{b.phone}</td>
              <td>{b.sbname || <span className="text-muted">—</span>}</td>
              <td>{b.dsbname || <span className="text-muted">—</span>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{b.pickup_date} {b.pickup_time}</td>
              <td><StatusBadge status={b.status} /></td>
              <td>
                {b.status === 'unassigned'
                  ? <button className="btn btn-gold btn-sm" onClick={() => onAssign(b.booking_ref)}>Assign</button>
                  : b.driver_name
                    ? <span style={{ fontSize: 12, color: 'var(--muted)' }}>{b.driver_name}</span>
                    : null
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  const [bsearch, setBsearch] = useState('');
  const [searchErr, setSearchErr] = useState('');
  const [results, setResults] = useState(null);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignMsgType, setAssignMsgType] = useState('success');
  const [allBookings, setAllBookings] = useState([]);
  const [tab, setTab] = useState('search'); // 'search' | 'all'

  async function loadAll() {
    const res = await fetch('/api/admin/all');
    setAllBookings(await res.json());
  }

  useEffect(() => { if (tab === 'all') loadAll(); }, [tab]);

  async function handleSearch() {
    setSearchErr('');
    setAssignMsg('');
    if (bsearch.trim() !== '' && !/^BRN\d{5}$/.test(bsearch.trim())) {
      setSearchErr('Invalid format. Use BRN followed by 5 digits, e.g. BRN00001.');
      setResults(null);
      return;
    }
    const res = await fetch('/api/admin/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bsearch: bsearch.trim() }),
    });
    setResults(await res.json());
  }

  async function handleAssign(brn) {
    setAssignMsg('');
    const res = await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brn }),
    });
    const data = await res.json();
    if (data.status === 'success') {
      setAssignMsg(`Congratulations! Booking request ${brn} has been assigned to ${data.driver_name}.`);
      setAssignMsgType('success');
      handleSearch();
    } else {
      setAssignMsg(data.message || 'Assignment failed.');
      setAssignMsgType('error');
    }
  }

  return (
    <div className="page-wide">
      <h2 className="section-title">Admin Dashboard</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['search', 'all'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t)}>
            {t === 'search' ? 'Search / Assign' : 'All Bookings'}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <>
          <div className="card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="bsearch">
                Booking Reference Number &nbsp;
                <span className="hint">leave empty to show upcoming unassigned (next 2 hrs)</span>
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <input
                  type="text" id="bsearch" name="bsearch"
                  value={bsearch}
                  onChange={e => setBsearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="e.g. BRN00001"
                  style={{ flex: 1 }}
                />
                <button id="sbutton" name="sbutton" className="btn btn-primary" onClick={handleSearch}>
                  Search
                </button>
              </div>
              {searchErr && <span className="error">{searchErr}</span>}
            </div>
          </div>

          {assignMsg && (
            <div className={`alert alert-${assignMsgType}`} id="assign-message">
              {assignMsg}
            </div>
          )}

          {results !== null && (
            <div className="card">
              <div className="content">
                <BookingTable bookings={results} onAssign={handleAssign} />
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'all' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>All Bookings ({allBookings.length})</span>
            <button className="btn btn-sm btn-outline" onClick={loadAll}>↻ Refresh</button>
          </div>
          <BookingTable bookings={allBookings} onAssign={async (brn) => {
            const res = await fetch('/api/admin/assign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ brn }),
            });
            const data = await res.json();
            if (data.status === 'success') loadAll();
            else alert(data.message);
          }} />
        </div>
      )}
    </div>
  );
}
