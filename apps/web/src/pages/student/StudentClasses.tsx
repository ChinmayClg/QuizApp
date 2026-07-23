import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { BookOpen, PlusCircle, Users, Clock, PlayCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentClasses() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'classes' | 'quizzes'>('classes');

  // Join Class Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classRes, quizRes] = await Promise.all([
        api.get<any>('/classes'),
        api.get<any>('/quizzes'),
      ]);
      setClasses(classRes.data || []);
      setQuizzes(quizRes.data || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code');
      return;
    }

    setIsJoining(true);
    try {
      await api.post('/classes/join', { joinCode });
      toast.success('Successfully joined class!');
      setShowJoinModal(false);
      setJoinCode('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to join class');
    } finally {
      setIsJoining(false);
    }
  };

  const activeQuizzes = quizzes.filter(q => q.status === 'PUBLISHED' || q.status === 'ACTIVE');

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>My Classes & Quizzes 📚</h1>
        <p>Manage your classes and discover new quizzes.</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowJoinModal(true)}>
            <PlusCircle size={18} /> Join Class
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-1)' }}>
        <button className={`btn btn-ghost btn-sm ${tab === 'classes' ? 'btn-primary' : ''}`} onClick={() => setTab('classes')}>
          <BookOpen size={14} /> Enrolled Classes ({classes.length})
        </button>
        <button className={`btn btn-ghost btn-sm ${tab === 'quizzes' ? 'btn-primary' : ''}`} onClick={() => setTab('quizzes')}>
          <PlayCircle size={14} /> Available Quizzes ({activeQuizzes.length})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : tab === 'classes' ? (
        <div>
          {classes.length === 0 ? (
            <div className="card empty-state">
              <BookOpen size={48} />
              <h3>Not enrolled in any classes</h3>
              <p>Ask your teacher for a class code to join.</p>
              <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowJoinModal(true)}>
                Join a Class
              </button>
            </div>
          ) : (
            <div className="grid">
              {classes.map((c: any) => (
                <div 
                  key={c.id} 
                  className="card hover-scale cursor-pointer"
                  onClick={() => navigate(`/student/classes/${c.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>{c.name}</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>{c.subject?.name}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Users size={14} /> {c.studentCount} Students
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <PlayCircle size={14} /> {c.quizCount} Quizzes
                    </div>
                  </div>
                  <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    Teacher: {c.teacher?.name}
                  </div>
                  <button className="btn btn-secondary w-full mt-4">
                    Open Class
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {activeQuizzes.length === 0 ? (
            <div className="card empty-state">
              <PlayCircle size={48} />
              <h3>No quizzes available</h3>
              <p>Your teachers haven't published any active quizzes yet.</p>
            </div>
          ) : (
            <div className="grid">
              {activeQuizzes.map((quiz: any) => (
                <div key={quiz.id} className="card hover-scale" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{quiz.title}</h3>
                      <span className={`badge ${quiz.hasAttempted ? 'badge-success' : 'badge-primary'}`}>
                        {quiz.hasAttempted ? 'Attempted' : 'New'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                      {quiz.class?.name} • {quiz.class?.subject?.name}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', margin: 'var(--space-4) 0' }}>
                    <span className="badge badge-info"><Clock size={12} style={{ marginRight: 4 }} /> {quiz.duration || '∞'} min</span>
                    <span className="badge badge-secondary"><Trophy size={12} style={{ marginRight: 4 }} /> {quiz._count?.questions} Qs</span>
                    <span className="badge badge-warning">{quiz.totalMarks} Marks</span>
                  </div>

                  <button className="btn btn-primary w-full" onClick={() => navigate(`/student/quiz/${quiz.id}`)}>
                    {quiz.hasAttempted ? 'Review / Retry' : 'Take Quiz'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Join Class</h2>
            </div>
            <div className="form-group">
              <label className="label">Class Join Code</label>
              <input
                className="input"
                placeholder="Enter 7-character code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleJoinClass} disabled={isJoining || !joinCode}>
                {isJoining ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
