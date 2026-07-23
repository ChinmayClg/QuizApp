// ===========================
// Student Dashboard
// ===========================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import {
  Trophy, Target, TrendingUp, BookOpen, Clock, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, Sparkles, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [activeAttempts, setActiveAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, activeRes] = await Promise.all([
        api.get<any>('/dashboard/student/dashboard'),
        api.get<any>('/attempts/active')
      ]);
      setDashboard(dashRes.data);
      setActiveAttempts(activeRes.data || []);
    } catch (error: any) {
      console.error('STUDENT DASHBOARD ERROR:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  const data = dashboard || {
    overallAverage: 0, totalQuizzesTaken: 0,
    recentAttempts: [], weakTopics: [], strongTopics: [],
    progressData: [], aiRecommendations: [],
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Hey, {user?.name?.split(' ')[0]}! 🎓</h1>
        <p>Track your progress and keep improving.</p>
      </div>

      {activeAttempts.length > 0 && (
        <div className="card-gradient mb-6 animate-fadeIn" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'white', marginBottom: 'var(--space-1)' }}>
              <Clock size={20} />
              You have an unfinished quiz!
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--font-size-sm)' }}>
              {activeAttempts[0].quiz.title} ({activeAttempts[0].quiz.class.name})
            </p>
          </div>
          <Link to={`/student/quiz/${activeAttempts[0].quizId}`} className="btn" style={{ background: 'white', color: 'var(--color-primary)' }}>
            Resume Quiz <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.15)', color: 'var(--color-primary-light)' }}>
            <Target size={24} />
          </div>
          <div className="stat-value">{data.overallAverage}%</div>
          <div className="stat-label">Overall Average</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 230, 118, 0.15)', color: 'var(--color-success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-value">{data.totalQuizzesTaken}</div>
          <div className="stat-label">Quizzes Taken</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(0, 210, 255, 0.15)', color: 'var(--color-secondary)' }}>
            <Trophy size={24} />
          </div>
          <div className="stat-value">{data.strongTopics.length}</div>
          <div className="stat-label">Strong Topics</div>
        </div>

        <div className="stat-card animate-fadeInUp stagger-item">
          <div className="stat-icon" style={{ background: 'rgba(255, 179, 0, 0.15)', color: 'var(--color-warning)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-value">{data.weakTopics.length}</div>
          <div className="stat-label">Need Improvement</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* New Quizzes */}
        {data.pendingQuizzes && data.pendingQuizzes.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={20} style={{ color: 'var(--color-primary)' }} />
                New Quizzes
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.pendingQuizzes.map((quiz: any) => (
                <div key={quiz.id} className="card-glass hover-scale" style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-1)' }}>{quiz.title}</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      {quiz.className} • {quiz.subjectName} • {quiz.marks} marks {quiz.duration ? `• ${quiz.duration} mins` : ''}
                    </p>
                  </div>
                  <Link to={`/student/quiz/${quiz.id}`} className="btn btn-primary btn-sm">
                    <Play size={16} /> Start
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="section-header">
            <h2>Recent Results</h2>
          </div>
          {data.recentAttempts.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <BookOpen size={48} />
              <h3>No quizzes taken yet</h3>
              <p>Join a class and start taking quizzes!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.recentAttempts.slice(0, 5).map((attempt: any, i: number) => (
                <div key={i} className="card-glass" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>{attempt.quizTitle}</strong>
                    <span className={`badge ${attempt.percentage >= 70 ? 'badge-success' : attempt.percentage >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                      {attempt.percentage}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      {attempt.className} • {attempt.score}/{attempt.totalMarks}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(attempt.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${attempt.percentage}%`,
                        background: attempt.percentage >= 70
                          ? 'var(--gradient-success)'
                          : attempt.percentage >= 40
                          ? 'linear-gradient(135deg, var(--color-warning), var(--color-warning-light))'
                          : 'linear-gradient(135deg, var(--color-danger), var(--color-danger-light))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Recommendations & Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* AI Recommendations */}
          <div className="card">
            <div className="section-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary-light)' }} />
                AI Recommendations
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {data.aiRecommendations.map((rec: string, i: number) => (
                <div key={i} className="card-glass" style={{ padding: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  💡 {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Strong & Weak Topics */}
          {data.strongTopics.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-4)' }}>
                🏆 Strong Topics
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {data.strongTopics.map((topic: any, i: number) => (
                  <span key={i} className="badge badge-success">
                    {topic.topic} ({topic.averageScore}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.weakTopics.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-4)' }}>
                📚 Needs Practice
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {data.weakTopics.map((topic: any, i: number) => (
                  <span key={i} className="badge badge-warning">
                    {topic.topic} ({topic.averageScore}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
