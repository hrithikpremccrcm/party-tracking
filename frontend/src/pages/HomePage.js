import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayParty, getUsers } from '../api';
import { useApp } from '../context/AppContext';
import { fireConfetti } from '../utils/confetti';
import { format } from 'date-fns';

const EMOJIS = ['🎉', '🎊', '🎈', '🥳', '🎂', '🎁', '🍾', '✨', '🌟', '💫', '🎆', '🎇'];

const FloatingEmoji = ({ emoji, style }) => (
  <div style={{
    position: 'absolute',
    fontSize: '2rem',
    animation: `float ${2 + Math.random() * 2}s ease-in-out infinite`,
    animationDelay: `${Math.random() * 2}s`,
    pointerEvents: 'none',
    ...style,
  }}>
    {emoji}
  </div>
);

const HomePage = () => {
  const [todayData, setTodayData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const { isAdmin, selectedUser, loginUser } = useApp();
  const navigate = useNavigate();
  const confettiFired = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, usersRes] = await Promise.all([getTodayParty(), getUsers()]);
        setTodayData(todayRes.data);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);

        if (todayRes.data?.userName && !confettiFired.current) {
          confettiFired.current = true;
          setTimeout(() => fireConfetti(), 500);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🎊</div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '18px' }}>Loading party info...</p>
        </div>
      </div>
    );
  }

  const isPartyDay = todayData?.userName;
  const today = format(new Date(), 'EEEE, MMMM do yyyy');

  return (
    <div className="page" style={{ position: 'relative', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
      {/* Floating emojis */}
      {EMOJIS.slice(0, 8).map((emoji, i) => (
        <FloatingEmoji key={i} emoji={emoji} style={{
          top: `${10 + (i * 12) % 80}%`,
          left: i % 2 === 0 ? `${5 + i * 3}%` : 'auto',
          right: i % 2 === 1 ? `${5 + i * 3}%` : 'auto',
          opacity: 0.4,
          zIndex: 0,
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Date */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>
          {today}
        </div>

        {/* Main party display */}
        {isPartyDay ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '1.2rem',
              color: 'var(--text-muted)',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              🎉 Today's Party Host 🎉
            </div>

            <div className="card pop-in" style={{
              padding: '50px 40px',
              background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(132,94,194,0.1))',
              border: '2px solid rgba(255,107,107,0.4)',
              borderRadius: '24px',
              marginBottom: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }} />

              <div style={{ fontSize: '7rem', marginBottom: '16px', display: 'block' }}>🎂</div>

              <h1 style={{
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '12px',
                lineHeight: 1.1,
                animation: 'rainbow 3s linear infinite',
                WebkitTextFillColor: 'unset',
              }}>
                {todayData.userName}
              </h1>

              <p style={{
                fontSize: '1.3rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}>
                is throwing the party today! 🥳
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ fontSize: '16px', padding: '14px 28px' }}
              onClick={() => fireConfetti()}
            >
              🎆 Celebrate!
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="card" style={{ padding: '60px 40px', marginBottom: '32px' }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px' }}>
                {todayData?.isWeekend ? '😴' : todayData?.isHoliday ? '🏖️' : '🤷'}
              </div>
              <h1 style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {todayData?.isWeekend ? 'It\'s the Weekend!' :
                  todayData?.isHoliday ? 'It\'s a Holiday!' :
                    'No Party Today'}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                {todayData?.isWeekend ? 'Relax and enjoy your days off 🎉' :
                  todayData?.isHoliday ? 'Enjoy the day off — party resumes soon!' :
                    'Check the calendar to see upcoming parties'}
              </p>
            </div>
          </div>
        )}

        {/* User login section */}
        {!isAdmin && !selectedUser && (
          <div className="card" style={{ marginTop: '24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>👤 Who are you?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Click your name to view your schedule
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {users.map(user => (
                <button
                  key={user.id}
                  className="btn btn-outline"
                  style={{ fontSize: '15px', padding: '10px 20px' }}
                  onClick={() => loginUser(user)}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="card" style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              👋 Hey <strong style={{ color: 'var(--primary)' }}>{selectedUser.name}</strong>!
            </p>
            <button
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
              onClick={() => navigate('/calendar')}
            >
              📅 View My Schedule
            </button>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/calendar')}>
            📅 Full Calendar
          </button>
          {isAdmin && (
            <>
              <button className="btn btn-yellow" onClick={() => navigate('/admin/cycle')}>
                🎯 Manage Cycle
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/admin/users')}>
                👥 Manage Users
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
