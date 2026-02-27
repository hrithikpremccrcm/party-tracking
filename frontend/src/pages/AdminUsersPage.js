import React, { useEffect, useState } from 'react';
import { getUsers, createUser, deleteUser } from '../api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await createUser(newName.trim());
      toast.success(`${newName} added! 🎉`);
      setNewName('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Remove ${user.name} from the party list?`)) return;
    try {
      await deleteUser(user.id);
      toast.success(`${user.name} removed`);
      fetchUsers();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚙️</div>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '6px' }}>👥 Manage Users</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Add or remove party members. New users are automatically added to the end of the current cycle.
        </p>
      </div>

      {/* Add user */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--secondary)' }}>➕ Add New Employee</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
          <input
            className="input"
            placeholder="Enter employee name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={adding || !newName.trim()}
          >
            {adding ? '⏳' : '➕ Add'}
          </button>
        </form>
      </div>

      {/* Users list */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>🎉 Party Members ({users.length})</h3>
        </div>

        {users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
            No users yet. Add some employees above!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((user, idx) => (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `hsl(${(idx * 60) % 360}, 60%, 50%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  flexShrink: 0,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {user.id}</div>
                </div>

                <span className="badge badge-green">Active</span>

                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => handleDelete(user)}
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

export default AdminUsersPage;
