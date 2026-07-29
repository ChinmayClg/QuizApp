// ===========================
// Quiz Detail Page (Teacher View)
// ===========================

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, Users, Clock, BarChart3, CheckCircle, Eye, Trash2, Edit3, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'submissions'>('overview');
  
  // Review Modal State
  const [reviewAttemptId, setReviewAttemptId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [overrides, setOverrides] = useState<{ [key: string]: { score: number; feedback: string } }>({});

  useEffect(() => {
    loadQuiz();
  }, [id]);

  const loadQuiz = async () => {
    try {
      const [quizRes, subRes] = await Promise.all([
        api.get<any>(`/quizzes/${id}`),
        api.get<any>(`/attempts/submissions/${id}`).catch(() => ({ data: [] })),
      ]);
      setQuiz(quizRes.data);
      setSubmissions(subRes.data || []);
    } catch {
      toast.error('Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      toast.success('Quiz deleted successfully');
      navigate('/teacher');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete quiz');
    }
  };

  const downloadCSV = () => {
    if (!submissions || submissions.length === 0) return;
    const headers = ['Student Name', 'Email', 'Score', 'Total Marks', 'Status', 'Cheat Warnings', 'Submitted At'];
    const rows = submissions.map((s: any) => [
      `"${s.student.name}"`,
      `"${s.student.email}"`,
      s.score || 0,
      s.totalMarks,
      `"${s.status}"`,
      s.cheatWarnings || 0,
      `"${s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${quiz?.title || 'quiz'}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReviewAttempt = async (attemptId: string) => {
    setReviewAttemptId(attemptId);
    setReviewLoading(true);
    setOverrides({});
    try {
      const res = await api.get<any>(`/attempts/${attemptId}/review`);
      setReviewData(res.data);
    } catch (err: any) {
      toast.error('Failed to load attempt details');
      setReviewAttemptId(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleOverrideSubmit = async (answerId: string) => {
    const override = overrides[answerId];
    if (!override) return;
    try {
      await api.put(`/attempts/override/${answerId}`, override);
      toast.success('Score updated!');
      // Update local state
      setReviewData((prev: any) => ({
        ...prev,
        answers: prev.answers.map((a: any) => 
          a.id === answerId ? { ...a, teacherScore: override.score, finalScore: override.score, teacherFeedback: override.feedback } : a
        )
      }));
      loadQuiz(); // Refresh submissions list score
    } catch (err: any) {
      toast.error('Failed to update score');
    }
  };

  if (isLoading || !quiz) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-fadeIn">
      <Link to="/teacher" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1>{quiz.title}</h1>
            <span className={`badge badge-${quiz.status === 'PUBLISHED' ? 'success' : 'warning'}`}>{quiz.status}</span>
          </div>
          <p>{quiz.class?.subject?.name} • {quiz.class?.name} • {quiz.questions?.length} questions • {quiz.totalMarks} marks</p>
          {(quiz.startTime || quiz.endTime) && (
            <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Schedule: {quiz.startTime ? new Date(quiz.startTime).toLocaleString() : 'Now'} to {quiz.endTime ? new Date(quiz.endTime).toLocaleString() : 'Forever'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to={`/teacher/quiz/edit/${id}`} className="btn btn-secondary">
            <Edit3 size={18} /> Edit Quiz
          </Link>
          <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={handleDelete}>
            <Trash2 size={18} /> Delete Quiz
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-1)' }}>
        <button className={`btn btn-ghost btn-sm ${tab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setTab('overview')}>
          <Eye size={14} /> Overview
        </button>
        <button className={`btn btn-ghost btn-sm ${tab === 'submissions' ? 'btn-primary' : ''}`} onClick={() => setTab('submissions')}>
          <Users size={14} /> Submissions ({submissions.length})
        </button>
      </div>

      {tab === 'overview' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-value">{quiz.questions?.length || 0}</div>
              <div className="stat-label">Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{quiz.totalMarks}</div>
              <div className="stat-label">Total Marks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{quiz.duration || '∞'}</div>
              <div className="stat-label">Minutes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{submissions.length}</div>
              <div className="stat-label">Submissions</div>
            </div>
          </div>

          {/* Questions List */}
          <div className="card">
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Questions</h2>
            {quiz.questions?.map((q: any, i: number) => (
              <div key={q.id} className="card-glass" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-primary" style={{ marginBottom: 'var(--space-2)' }}>{q.type}</span>
                    <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Q{i + 1}. {q.questionText}</p>
                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt="Question"
                        style={{
                          maxWidth: 200,
                          maxHeight: 120,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-primary)',
                          objectFit: 'contain',
                          marginTop: 'var(--space-2)',
                        }}
                      />
                    )}
                  </div>
                  <span className="badge badge-info">{q.marks} marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'submissions' && (
        <div className="card">
          {submissions.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h3>No submissions yet</h3>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  <Download size={16} /> Download CSV
                </button>
              </div>
              <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Cheat Warnings</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s: any) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 'var(--font-size-xs)' }}>
                            {s.student.name.charAt(0)}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>{s.student.name}</strong>
                            <br />
                            <span style={{ fontSize: 'var(--font-size-xs)' }}>{s.student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{s.score || 0}</strong>/{s.totalMarks}
                      </td>
                      <td>
                        <span className={`badge badge-${s.status === 'GRADED' ? 'success' : 'warning'}`}>{s.status}</span>
                      </td>
                      <td>
                        {s.cheatWarnings > 0 ? (
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{s.cheatWarnings} ⚠️</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleReviewAttempt(s.id)}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewAttemptId && (
        <div className="modal-overlay" onClick={() => setReviewAttemptId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10, paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)' }}>
              <div>
                <h2>{reviewData?.student?.name || 'Loading...'}</h2>
                <p className="text-muted text-sm">{reviewData?.student?.email}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setReviewAttemptId(null)}>
                <X size={18} />
              </button>
            </div>

            {reviewLoading || !reviewData ? (
              <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
            ) : (
              <div style={{ marginTop: 'var(--space-6)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', background: 'var(--bg-glass)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                  <div>
                    <span className="text-muted text-sm">Score</span>
                    <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold' }}>{reviewData.score || 0} / {reviewData.totalMarks}</p>
                  </div>
                  <div>
                    <span className="text-muted text-sm">Status</span>
                    <p><span className="badge badge-primary">{reviewData.status}</span></p>
                  </div>
                </div>

                <h3>Answers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                  {reviewData.answers.map((answer: any, i: number) => {
                    const isDescriptive = answer.question?.type === 'DESCRIPTIVE';
                    const currentOverride = overrides[answer.id] || { score: answer.finalScore, feedback: answer.teacherFeedback || '' };
                    
                    return (
                      <div key={answer.id} className="card-glass" style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                          <span className="badge badge-primary">{answer.question?.type}</span>
                          <span style={{ fontWeight: 'bold', color: answer.finalScore > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            Score: {answer.finalScore} / {answer.question?.marks}
                          </span>
                        </div>
                        <p style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>Q{i + 1}. {answer.question?.questionText}</p>
                        
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                          <span className="text-muted text-sm d-block" style={{ marginBottom: 'var(--space-1)' }}>Student Answer:</span>
                          {answer.answer}
                        </div>

                        {answer.aiReasoning && (
                          <div style={{ background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                            <strong style={{ color: 'var(--color-primary)' }}>🤖 AI Grading:</strong> {answer.aiReasoning}
                          </div>
                        )}

                        {isDescriptive && (
                          <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                            <h4 style={{ marginBottom: 'var(--space-2)' }}>Manual Override</h4>
                            <div className="form-row">
                              <div className="form-group" style={{ flex: 1 }}>
                                <input type="number" className="input" placeholder={`Score (max ${answer.question?.marks})`} max={answer.question?.marks} min={0} value={currentOverride.score} onChange={(e) => setOverrides(prev => ({ ...prev, [answer.id]: { ...currentOverride, score: Number(e.target.value) } }))} />
                              </div>
                              <div className="form-group" style={{ flex: 3 }}>
                                <input type="text" className="input" placeholder="Feedback for student..." value={currentOverride.feedback} onChange={(e) => setOverrides(prev => ({ ...prev, [answer.id]: { ...currentOverride, feedback: e.target.value } }))} />
                              </div>
                              <button className="btn btn-primary" onClick={() => handleOverrideSubmit(answer.id)}>Save</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
