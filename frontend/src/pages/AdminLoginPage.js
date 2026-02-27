import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(password);
      if (res.data.success) {
        loginAdmin();
        toast.success('Welcome back, Admin! 🎊');
        navigate('/');
      } else {
        toast.error('Wrong password! 🚫');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
    }}>
      <div className="card pop-in" style={{
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        padding: '48px 40px',
        background: 'linear-gradient(135deg, rgba(132,94,194,0.1), rgba(255,107,107,0.1))',
        border: '1px solid rgba(132,94,194,0.3)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚙️</div>
        <h1 style={{ marginBottom: '8px', fontSize: '2rem' }}>Admin Login</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
          Enter your admin password to manage the party calendar
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="password"
            className="input"
            placeholder="Enter admin password..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ textAlign: 'center', fontSize: '16px', letterSpacing: '3px' }}
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !password}
            style={{ width: '100%', padding: '14px', fontSize: '16px', justifyContent: 'center' }}
          >
            {loading ? '⏳ Checking...' : '🔐 Enter Admin Mode'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
