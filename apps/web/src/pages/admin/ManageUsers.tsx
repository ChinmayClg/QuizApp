// ===========================
// Manage Users Page (Admin)
// ===========================

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Users, Search, Shield, UserX, UserCheck, Plus, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Add User Form state
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'STUDENT', password: '', enrollmentNumber: '', employeeId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', formData);
      toast.success('User created successfully');
      setShowAddModal(false);
      setFormData({ name: '', email: '', role: 'STUDENT', password: '', enrollmentNumber: '', employeeId: '' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return toast.error('Please select a file');
    setIsSubmitting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);
          
          if (jsonData.length === 0) throw new Error('Excel file is empty');
          
          const usersPayload = jsonData.map(row => ({
            name: row.Name || row.name,
            email: row.Email || row.email,
            role: (row.Role || row.role || 'STUDENT').toUpperCase(),
            password: row.Password || row.password || undefined,
            enrollmentNumber: row.EnrollmentNumber || row.enrollmentNumber || undefined,
            employeeId: row.EmployeeId || row.employeeId || undefined,
          }));
          
          const res = await api.post<any>('/users/bulk', { users: usersPayload });
          toast.success(`Successfully added ${res.data.successful} users. Failed: ${res.data.failed}`);
          if (res.data.errors && res.data.errors.length > 0) {
            console.error('Bulk errors:', res.data.errors);
          }
          setShowBulkModal(false);
          setBulkFile(null);
          loadUsers();
        } catch (error: any) {
          toast.error(error.message || 'Failed to process Excel file');
        } finally {
          setIsSubmitting(false);
        }
      };
      reader.readAsArrayBuffer(bulkFile);
    } catch (error: any) {
      toast.error('Error reading file');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Users 👥</h1>
          <p>View and manage all users on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            <Upload size={18} /> Bulk Upload
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add User
          </button>
        </div>
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slideUp">
            <h3>Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label>Full Name</label>
                <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password (optional)</label>
                <input type="text" className="input" placeholder="Defaults to Welcome@123" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              {formData.role === 'STUDENT' && (
                <div className="form-group">
                  <label>Enrollment Number</label>
                  <input className="input" value={formData.enrollmentNumber} onChange={e => setFormData({...formData, enrollmentNumber: e.target.value})} />
                </div>
              )}
              {formData.role === 'TEACHER' && (
                <div className="form-group">
                  <label>Employee ID</label>
                  <input className="input" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slideUp">
            <h3>Bulk Upload Users</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Upload an Excel (.xlsx) file containing columns: Name, Email, Role, Password (optional), EnrollmentNumber (optional), EmployeeId (optional).
            </p>
            <div className="form-group">
              <input type="file" className="input" accept=".xlsx, .csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowBulkModal(false); setBulkFile(null); }} disabled={isSubmitting}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleBulkUpload} disabled={isSubmitting || !bulkFile}>
                {isSubmitting ? 'Uploading...' : 'Upload & Register'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
