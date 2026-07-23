import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Hash, Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    enrollmentNumber: '',
    employeeId: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || '',
        enrollmentNumber: (user as any).enrollmentNumber || '',
        employeeId: (user as any).employeeId || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        name: formData.name,
        department: formData.department,
        enrollmentNumber: formData.enrollmentNumber,
        employeeId: formData.employeeId,
      });

      // Update local storage so context reflects changes
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('quizai_user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      window.location.reload(); // Quick way to sync context state
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page-container animate-fadeInUp">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-desc">Manage your personal information and account settings.</p>
        </div>
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Email Address (Read-only)</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="input input-with-icon opacity-70"
                value={user.email}
                disabled
              />
            </div>
            <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Your college email address cannot be changed.</p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                name="name"
                type="text"
                className="input input-with-icon"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="label">Department</label>
            <div className="input-wrapper">
              <Building2 size={18} className="input-icon" />
              <input
                name="department"
                type="text"
                className="input input-with-icon"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>

          {user.role === 'STUDENT' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Seat / Enrollment Number</label>
              <div className="input-wrapper">
                <Hash size={18} className="input-icon" />
                <input
                  name="enrollmentNumber"
                  type="text"
                  className="input input-with-icon"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  placeholder="e.g. 2024CS001"
                />
              </div>
            </div>
          )}

          {user.role === 'TEACHER' && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Employee ID</label>
              <div className="input-wrapper">
                <Hash size={18} className="input-icon" />
                <input
                  name="employeeId"
                  type="text"
                  className="input input-with-icon"
                  value={formData.employeeId}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
