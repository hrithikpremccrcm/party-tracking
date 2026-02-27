import React, { useState, useRef, useEffect } from 'react';
import { fireConfetti, fireRainbow } from '../utils/confetti';

const SpinningWheel = ({ users, onSelect, alreadySelected }) => {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [currentAngle, setCurrentAngle] = useState(0);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  const available = users.filter(u => !alreadySelected.includes(u.id));

  const COLORS = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#845ec2', '#ff6bca', '#ff9a3c', '#00c9a7',
    '#c34b4b', '#b8a900', '#3a7a40', '#2c5fa3',
  ];

  const drawWheel = (angle = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || available.length === 0) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 10;
    const slice = (2 * Math.PI) / available.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    available.forEach((user, i) => {
      const startAngle = angle + i * slice;
      const endAngle = startAngle + slice;

      // Slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.font = `bold ${Math.max(12, Math.min(16, 280 / available.length))}px Nunito`;
      const name = user.name.length > 10 ? user.name.slice(0, 10) + '…' : user.name;
      ctx.fillText(name, radius - 12, 6);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d0d1a';
    ctx.fill();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Righteous';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉', cx, cy);
  };

  useEffect(() => {
    drawWheel(angleRef.current);
  }, [available.length]);

  const spin = () => {
    if (spinning || available.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const totalSpins = 5 + Math.random() * 5; // 5-10 full rotations
    const extraAngle = Math.random() * 2 * Math.PI;
    const totalAngle = totalSpins * 2 * Math.PI + extraAngle;
    const duration = 4000 + Math.random() * 2000;
    const startTime = performance.now();
    const startAngle = angleRef.current;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + totalAngle * eased;
      angleRef.current = angle;
      drawWheel(angle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winner
        const slice = (2 * Math.PI) / available.length;
        const normalized = ((- angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const winnerIdx = Math.floor(normalized / slice) % available.length;
        const winner = available[winnerIdx];

        setWinner(winner);
        setSpinning(false);
        fireRainbow();
        setTimeout(() => fireConfetti(), 300);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const handleSelect = () => {
    if (winner) {
      onSelect(winner);
      setWinner(null);
    }
  };

  if (available.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '4rem' }}>🎊</div>
        <p style={{ marginTop: '12px' }}>All users have been assigned!</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Arrow/pointer */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '-20px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          fontSize: '2rem',
          filter: 'drop-shadow(0 0 8px rgba(255,107,107,0.8))',
        }}>
          ◀
        </div>

        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          style={{ borderRadius: '50%', boxShadow: '0 0 40px rgba(255,107,107,0.3)' }}
        />
      </div>

      <div style={{ marginTop: '24px' }}>
        {!winner ? (
          <button
            className="btn btn-primary"
            style={{ padding: '14px 40px', fontSize: '18px' }}
            onClick={spin}
            disabled={spinning}
          >
            {spinning ? '🌀 Spinning...' : '🎰 SPIN!'}
          </button>
        ) : (
          <div className="pop-in">
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,107,107,0.2), rgba(132,94,194,0.2))',
              border: '2px solid var(--primary)',
              borderRadius: '16px',
              padding: '20px 32px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '3rem' }}>🎉</div>
              <h2 style={{
                fontSize: '2rem',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {winner.name}
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Selected!</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-success" onClick={handleSelect}>
                ✅ Add to Cycle
              </button>
              <button className="btn btn-ghost" onClick={() => { setWinner(null); spin(); }}>
                🔄 Spin Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinningWheel;
