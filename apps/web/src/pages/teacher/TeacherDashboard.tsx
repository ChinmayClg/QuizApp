// ===========================
// Teacher Dashboard
// ===========================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  Users, BookOpen, Clock, FileText, Plus, ArrowRight,
  TrendingUp, Activity, CheckCircle, FileQuestion, PlusCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (retries = 2) => {
    try {
      const res = await api.get<any>('/dashboard/teacher/dashboard');
      setDashboard(res.data);
    } catch (error: any) {
      console.error('DASHBOARD ERROR:', error);
      if (retries > 0) {
        setTimeout(() => loadDashboard(retries - 1), 2000);
        return;
      }
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-muted">Loading dashboard...</p>
      </div>
    );
  }

  const data = dashboard || { totalClasses: 0, totalStudents: 0, totalQuizzes: 0, activeQuizzes: 0, recentQuizzes: [], classPerformance: [] };
  const stats = data;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your classes today.</p>
        <div className="header-actions">
          <Link to="/teacher/quiz/create" className="btn btn-primary">
            <PlusCircle size={18} />
            Create Quiz
          </Link>
          <Link to="/teacher/classes" className="btn btn-secondary">
            <BookOpen size={18} />
            My Classes
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: 'var(--color-primary-light)' }}>
            <BookOpen size={24} />
          </div>
          <div className="stat-value">{stats.totalClasses}</div>
          <div className="stat-label">Active Classes</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--color-success)' }}>
            <Users size={24} />
          </div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--color-secondary)' }}>
            <FileQuestion size={24} />
          </div>
          <div className="stat-value">{stats.totalQuizzes}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(255, 107, 157, 0.15)', color: 'var(--color-accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-value">{stats.activeQuizzes}</div>
          <div className="stat-label">Active Quizzes</div>
        </div>
      </div>

      {/* Recent Quizzes & Quick Actions */}
      <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        <div className="card">
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
              Recent Quizzes
            </h2>
          </div>

          {stats.recentQuizzes.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <FileQuestion size={48} />
              <h3>No quizzes yet</h3>
              <p>Create your first quiz to get started!</p>
              <Link to="/teacher/quiz/create" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                <PlusCircle size={16} /> Create Quiz
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {stats.recentQuizzes.map((quiz: any) => (
                <Link
                  key={quiz.id}
                  to={`/teacher/quiz/${quiz.id}`}
                  className="card-glass hover-lift"
                  style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                      {quiz.title}
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      {quiz.className} • {quiz.attemptCount} attempts
                    </p>
                  </div>
                  <span className={`badge badge-${quiz.status === 'PUBLISHED' ? 'success' : quiz.status === 'DRAFT' ? 'warning' : 'info'}`}>
                    {quiz.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link to="/teacher/quiz/create" className="card-glass hover-scale" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'rgba(108, 99, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-light)' }}>
                <PlusCircle size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>Create New Quiz</strong>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Build a quiz with any question type</p>
              </div>
            </Link>

            <Link to="/teacher/question-bank" className="card-glass hover-scale" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'rgba(0, 210, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>AI Question Generator</strong>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>Generate questions with Gemini AI</p>
              </div>
            </Link>

            <Link to="/teacher/classes" className="card-glass hover-scale" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>Manage Classes</strong>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>View and manage your classes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
