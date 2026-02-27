import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, startNewCycle } from '../api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SpinningWheel from '../components/SpinningWheel';
import { fireConfetti, fireSmallConfetti } from '../utils/confetti';

const modes = [
  { id: 'drag', label: '🖱️ Drag & Drop', desc: 'Manually order users by dragging' },
  { id: 'auto', label: '🤖 Auto Allocate', desc: 'System picks a random order automatically' },
  { id: 'wheel', label: '🎰 Spin Wheel', desc: 'Use a spinning wheel to pick one by one' },
];

const SortableUserItem = ({ user, index, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: user.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: isDragging ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        cursor: 'grab',
        marginBottom: '6px',
        userSelect: 'none',
      }}
    >
      <span style={{ color: 'var(--text-muted)', minWidth: '24px', fontWeight: 700 }}>#{index + 1}</span>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: `hsl(${(index * 47) % 360}, 60%, 50%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, flexShrink: 0,
      }}>
        {user.name.charAt(0)}
      </div>
      <span style={{ flex: 1, fontWeight: 600 }}>{user.name}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⠿ drag</span>
      <button
        className="btn btn-ghost"
        style={{ padding: '4px 8px', fontSize: '12px' }}
        onClick={(e) => { e.stopPropagation(); onRemove(user.id); }}
        onPointerDown={e => e.stopPropagation()}
      >
        ✕
      </button>
    </div>
  );
};

const AdminCyclePage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [mode, setMode] = useState('drag');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setAllUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setSelectedUsers(users => {
        const oldIdx = users.findIndex(u => u.id === active.id);
        const newIdx = users.findIndex(u => u.id === over.id);
        return arrayMove(users, oldIdx, newIdx);
      });
    }
  };

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
      fireSmallConfetti();
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleAutoAllocate = () => {
    // Keep already-selected users in their current order
    // Randomly shuffle only the remaining unselected users
    const unselected = allUsers.filter(u => !selectedUsers.find(s => s.id === u.id));
    const shuffledUnselected = [...unselected].sort(() => Math.random() - 0.5);
    setSelectedUsers([...selectedUsers, ...shuffledUnselected]);
    toast.success(`Added ${shuffledUnselected.length} users in random order! 🎲`);
    fireSmallConfetti();
  };

  const handleWheelSelect = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    toast.success(`${user.name} added! 🎉`);
  };

  const handleStartCycle = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please add at least one user');
      return;
    }
    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }
    if (!window.confirm(`Start a new cycle with ${selectedUsers.length} users?`)) return;

    setSubmitting(true);
    try {
      await startNewCycle({
        userIds: selectedUsers.map(u => u.id),
        startDate,
      });
      fireConfetti();
      toast.success('🎉 New cycle started!');
      navigate('/calendar');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const unselectedUsers = allUsers.filter(u => !selectedUsers.find(s => s.id === u.id));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🎯</div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🎯 Start New Cycle</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Allocate the party order for the next cycle. Choose your method below!
        </p>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding: '14px 20px',
              borderRadius: '14px',
              border: `2px solid ${mode === m.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
              background: mode === m.id ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.02)',
              color: mode === m.id ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              textAlign: 'left',
              transition: 'all 0.2s',
              flex: 1,
              minWidth: '180px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{m.label}</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>{m.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Left panel */}
        <div>
          {mode === 'drag' && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--secondary)' }}>👥 Available Users</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Click to add to the cycle order
              </p>
              {unselectedUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  All users added! ✅
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {unselectedUsers.map(user => (
                    <button
                      key={user.id}
                      className="btn btn-outline"
                      style={{ fontSize: '14px' }}
                      onClick={() => addUser(user)}
                    >
                      + {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'auto' && (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🤖</div>
              <h3 style={{ marginBottom: '12px' }}>Auto Allocate</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                Click the button and we'll randomly shuffle all {allUsers.length} users into a party order!
              </p>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '16px', padding: '14px 28px' }}
                onClick={handleAutoAllocate}
              >
                🎲 Randomize Order!
              </button>
            </div>
          )}

          {mode === 'wheel' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '4px', color: 'var(--secondary)' }}>🎰 Spinning Wheel</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Spin the wheel to randomly pick users one by one!
              </p>
              <SpinningWheel
                users={allUsers}
                onSelect={handleWheelSelect}
                alreadySelected={selectedUsers.map(u => u.id)}
              />
            </div>
          )}
        </div>

        {/* Right panel: cycle order */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>📋 Cycle Order ({selectedUsers.length} users)</h3>
              {selectedUsers.length > 0 && (
                <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedUsers([])}>
                  Clear All
                </button>
              )}
            </div>

            {selectedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👆</div>
                <p>Add users to define the party order</p>
              </div>
            ) : mode === 'drag' ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedUsers.map(u => u.id)} strategy={verticalListSortingStrategy}>
                  {selectedUsers.map((user, idx) => (
                    <SortableUserItem key={user.id} user={user} index={idx} onRemove={removeUser} />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedUsers.map((user, idx) => (
                  <div key={user.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    animation: 'slide-up 0.3s ease forwards',
                    animationDelay: `${idx * 0.05}s`,
                    opacity: 0,
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 700, minWidth: '24px' }}>#{idx + 1}</span>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: `hsl(${(idx * 47) % 360}, 60%, 50%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0,
                    }}>
                      {user.name.charAt(0)}
                    </div>
                    <span style={{ flex: 1, fontWeight: 600 }}>{user.name}</span>
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => removeUser(user.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Start date + submit */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>🚀 Start Cycle</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Cycle Start Date
              </label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px' }}
              onClick={handleStartCycle}
              disabled={submitting || selectedUsers.length === 0}
            >
              {submitting ? '⏳ Starting...' : `🎉 Start Cycle with ${selectedUsers.length} Users`}
            </button>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
              ⚠️ This will replace the current active cycle
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCyclePage;
