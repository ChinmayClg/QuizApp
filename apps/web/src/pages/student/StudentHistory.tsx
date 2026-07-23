// ===========================
// Student History Page
// ===========================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { BookOpen, Calendar, CheckCircle, Search, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get<any>('/dashboard/student/history');
      setHistory(res.data);
    } catch (error: any) {
      toast.error('Failed to load quiz history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Quiz History 📚</h1>
        <p>Review all your past quizzes and track your progress over time.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ position: 'relative', flex: 1, minWidth: 250, margin: 0 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 40 }} 
              placeholder="Search by quiz title or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
            <div className="badge badge-primary"><BookOpen size={14} style={{ marginRight: 4 }} /> {history.length} Quizzes</div>
            <div className="badge badge-success"><Trophy size={14} style={{ marginRight: 4 }} /> Avg {Math.round(history.reduce((acc, h) => acc + h.percentage, 0) / (history.length || 1))}%</div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-12) 0' }}>
            <Calendar size={48} />
            <h3>No history found</h3>
            <p>Take some quizzes or adjust your search.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Quiz Details</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{item.quizTitle}</strong>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{item.className}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{item.subjectName}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{item.score}</strong>/{item.totalMarks}
                        <span className={`badge ${item.percentage >= 70 ? 'badge-success' : item.percentage >= 40 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status === 'GRADED' ? 'success' : 'warning'}`}>
                        {item.status === 'GRADED' ? <><CheckCircle size={12} style={{ marginRight: 4 }} /> Graded</> : item.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <Link to={`/student/results/${item.id}`} className="btn btn-secondary btn-sm">
                        View Results
                      </Link>
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
