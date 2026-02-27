import React, { useEffect, useState } from 'react';
import { getHolidays, addHoliday, deleteHoliday } from '../api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ holidayDate: '', description: '' });
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchHolidays();
  }, [isAdmin]);

  const fetchHolidays = async () => {
    try {
      const res = await getHolidays();
      setHolidays(Array.isArray(res.data) ? res.data.sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate)) : []);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.holidayDate) return;
    try {
      await addHoliday(form);
      toast.success(`Holiday added! 🏖️ Any party scheduled on that day has been shifted.`);
      setForm({ holidayDate: '', description: '' });
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add holiday');
    }
  };

  const handleDelete = async (holiday) => {
    if (!window.confirm(`Remove holiday on ${format(parseISO(holiday.holidayDate), 'MMM do, yyyy')}?`)) return;
    try {
      await deleteHoliday(holiday.id);
      toast.success('Holiday removed');
      fetchHolidays();
    } catch {
      toast.error('Failed to remove holiday');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🏖️</div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🏖️ Manage Holidays</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Add holidays to the calendar. Parties scheduled on holiday dates are automatically shifted forward.
        </p>
      </div>

      {/* Add holiday */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--secondary)' }}>➕ Add Holiday</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Date
            </label>
            <input
              type="date"
              className="input"
              value={form.holidayDate}
              onChange={e => setForm(f => ({ ...f, holidayDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Description (optional)
            </label>
            <input
              className="input"
              placeholder="e.g. Diwali, Christmas..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!form.holidayDate}>
            🏖️ Add Holiday
          </button>
        </form>
      </div>

      {/* Holidays list */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>📅 Upcoming Holidays ({holidays.length})</h3>
        {holidays.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
            No holidays added yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {holidays.map(h => (
              <div key={h.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 16px',
                background: 'rgba(77,150,255,0.08)',
                border: '1px solid rgba(77,150,255,0.2)',
                borderRadius: '12px',
              }}>
                <div style={{ fontSize: '1.5rem' }}>🏖️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>
                    {format(parseISO(h.holidayDate), 'EEEE, MMMM do yyyy')}
                  </div>
                  {h.description && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{h.description}</div>
                  )}
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleDelete(h)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaysPage;
