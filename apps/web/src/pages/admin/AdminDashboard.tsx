// ===========================
// Admin Dashboard
// ===========================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Users, GraduationCap, Building2, FileQuestion, BarChart3, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get<any>('/dashboard/admin/dashboard');
      setDashboard(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const data = dashboard || { totalUsers: 0, totalTeachers: 0, totalStudents: 0, totalDepartments: 0, totalSubjects: 0, totalQuizzes: 0, totalAttempts: 0, departmentAnalytics: [], recentActivity: [] };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Admin Dashboard 🏛️</h1>
        <p>College-wide overview of the assessment platform.</p>
        <div className="header-actions">
          <Link to="/admin/users" className="btn btn-primary">
            <Users size={18} /> Manage Users
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: 'var(--color-primary-light)' }}>
            <Users size={24} />
          </div>
          <div className="stat-value">{data.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--color-secondary)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-value">{data.totalTeachers}</div>
          <div className="stat-label">Teachers</div>
        </div>
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--color-success)' }}>
            <Users size={24} />
          </div>
          <div className="stat-value">{data.totalStudents}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 157, 0.15)', color: 'var(--color-accent)' }}>
            <FileQuestion size={24} />
          </div>
          <div className="stat-value">{data.totalQuizzes}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>
      </div>

      <div className="content-grid">
        {/* Department Analytics */}
        <div className="card">
          <div className="section-header">
            <h2>Departments</h2>
          </div>
          {data.departmentAnalytics.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
              <Building2 size={40} />
              <h3>No departments yet</h3>
              <p>Create departments to organize your institution.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.departmentAnalytics.map((dept: any) => (
                <div key={dept.departmentId} className="card-glass" style={{ padding: 'var(--space-4)' }}>
                  <strong style={{ fontSize: 'var(--font-size-sm)' }}>{dept.departmentName}</strong>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    <span>{dept.studentCount} students</span>
                    <span>{dept.quizCount} quizzes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="text-muted text-sm">No recent activity.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.recentActivity.slice(0, 8).map((activity: any) => (
                <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <Activity size={16} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{activity.description}</p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {activity.userName} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
