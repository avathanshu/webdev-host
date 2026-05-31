// pages/BookingPage.jsx
// Passenger booking form — validates inputs and submits to /api/booking

import { useState, useEffect } from 'react';

function now() {
  const d = new Date();
  return {
    date: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`,
    time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  };
}

const EMPTY = { cname:'', phone:'', unumber:'', snumber:'', stname:'', sbname:'', dsbname:'', date:'', time:'' };

export default function BookingPage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    const n = now();
    setForm(f => ({ ...f, date: n.date, time: n.time }));
  }, []);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    const errs = {};
    if (!form.cname.trim()) errs.cname = 'Customer name is required.';
    if (!/^\d{10,12}$/.test(form.phone.trim())) errs.phone = 'Phone must be 10–12 digits.';
    if (!form.snumber.trim()) errs.snumber = 'Street number is required.';
    if (!form.stname.trim()) errs.stname = 'Street name is required.';
    if (!form.date.trim()) errs.date = 'Pickup date is required.';
    if (!form.time.trim()) errs.time = 'Pickup time is required.';

    if (form.date && form.time) {
      const parts = form.date.split('/');
      if (parts.length !== 3 || isNaN(+parts[0]) || isNaN(+parts[1]) || isNaN(+parts[2])) {
        errs.date = 'Date must be in DD/MM/YYYY format.';
      } else {
        const pickup = new Date(+parts[2], +parts[1]-1, +parts[0], +form.time.split(':')[0], +form.time.split(':')[1]);
        if (pickup < new Date()) errs.date = 'Pickup date and time cannot be in the past.';
      }
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerErr('');
    setConfirmation(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setConfirmation(data);
        const n = now();
        setForm({ ...EMPTY, date: n.date, time: n.time });
        setErrors({});
      } else {
        setServerErr(data.message || 'Booking failed. Please try again.');
      }
    } catch {
      setServerErr('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2 className="section-title">Book a Taxi</h2>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-row">
            <div className="form-group">
              <label>Customer Name</label>
              <input type="text" name="cname" value={form.cname} onChange={set('cname')} placeholder="Full name" />
              {errors.cname && <span className="error">{errors.cname}</span>}
            </div>
            <div className="form-group">
              <label>Phone <span className="hint">10–12 digits</span></label>
              <input type="text" name="phone" value={form.phone} onChange={set('phone')} placeholder="e.g. 0211234567" />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>
          </div>

          <fieldset>
            <legend>Pickup Address</legend>

            <div className="form-row">
              <div className="form-group">
                <label>Unit Number <span className="hint">optional</span></label>
                <input type="text" name="unumber" value={form.unumber} onChange={set('unumber')} placeholder="e.g. 3A" />
              </div>
              <div className="form-group">
                <label>Street Number</label>
                <input type="text" name="snumber" value={form.snumber} onChange={set('snumber')} placeholder="e.g. 42" />
                {errors.snumber && <span className="error">{errors.snumber}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Street Name</label>
              <input type="text" name="stname" value={form.stname} onChange={set('stname')} placeholder="e.g. Queen Street" />
              {errors.stname && <span className="error">{errors.stname}</span>}
            </div>

            <div className="form-group">
              <label>Suburb <span className="hint">optional</span></label>
              <input type="text" name="sbname" value={form.sbname} onChange={set('sbname')} placeholder="e.g. Auckland CBD" />
            </div>
          </fieldset>

          <div className="form-group">
            <label>Destination Suburb <span className="hint">optional</span></label>
            <input type="text" name="dsbname" value={form.dsbname} onChange={set('dsbname')} placeholder="e.g. Ponsonby" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pick-up Date <span className="hint">DD/MM/YYYY</span></label>
              <input type="text" name="date" value={form.date} onChange={set('date')} placeholder="DD/MM/YYYY" />
              {errors.date && <span className="error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label>Pick-up Time <span className="hint">24h</span></label>
              <input type="time" name="time" value={form.time} onChange={set('time')} />
              {errors.time && <span className="error">{errors.time}</span>}
            </div>
          </div>

          {serverErr && <div className="alert alert-error">{serverErr}</div>}

          <div className="form-group" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Booking'}
            </button>
          </div>
        </form>
      </div>

      {confirmation && (
        <div className="confirm-box" id="confirmation-area">
          <p id="reference" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>
            Thank you for your booking!
          </p>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div>Booking reference number: <strong>{confirmation.brn}</strong></div>
            <div>Pickup time: <strong>{confirmation.time}</strong></div>
            <div>Pickup date: <strong>{confirmation.date}</strong></div>
          </div>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
            Use the <a href="/track" style={{ color: 'var(--green)', fontWeight: 600 }}>Track</a> page to monitor your booking status.
          </p>
        </div>
      )}
    </div>
  );
}
