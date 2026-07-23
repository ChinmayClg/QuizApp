// ===========================
// Manage Users Page (Admin)
// ===========================

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Users, Search, Shield, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);
      const res = await api.get<any>(`/users?${params.toString()}`);
      setUsers(res.data || []);
    } catch {} finally { setIsLoading(false); }
  };

  const toggleActive = async (userId: string) => {
    try {
      await api.put(`/users/${userId}/toggle-active`);
      toast.success('User status updated');
      loadUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Manage Users 👥</h1>
        <p>View and manage all users on the platform.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
          />
        </div>
        {['', 'STUDENT', 'TEACHER', 'ADMIN'].map((role) => (
          <button
            key={role}
            className={`btn ${roleFilter === role ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setRoleFilter(role)}
          >
            {role || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 'var(--font-size-xs)' }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>
                          <br /><span style={{ fontSize: 'var(--font-size-xs)' }}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role === 'ADMIN' ? 'danger' : u.role === 'TEACHER' ? 'primary' : 'info'}`}>{u.role}</span></td>
                    <td>{u.department || '-'}</td>
                    <td>
                      <span className={`badge badge-${u.isActive ? 'success' : 'danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u.id)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
