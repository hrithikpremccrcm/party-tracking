import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logoutAdmin, selectedUser, logoutUser } = useApp();

  const navItems = [
    { label: '🏠 Home', path: '/' },
    { label: '📅 Calendar', path: '/calendar' },
    ...(isAdmin ? [
      { label: '👥 Users', path: '/admin/users' },
      { label: '🎉 New Cycle', path: '/admin/cycle' },
      { label: '🏖️ Holidays', path: '/admin/holidays' },
    ] : []),
  ];

  const handleLogout = () => {
    if (isAdmin) {
      logoutAdmin();
    } else {
      logoutUser();
    }
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        🎊 PartyTracker
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {navItems.map(item => (
          <button
            key={item.path}
            className={`btn ${location.pathname === item.path ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}

        {(isAdmin || selectedUser) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 12px',
              borderRadius: '8px',
            }}>
              {isAdmin ? '⚙️ Admin' : `👤 ${selectedUser?.name}`}
            </span>
            <button className="btn btn-danger" style={{ padding: '7px 12px', fontSize: '12px' }} onClick={handleLogout}>
              Exit
            </button>
          </div>
        )}

        {!isAdmin && !selectedUser && (
          <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => navigate('/login')}>
            🔐 Admin Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
