import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { BookOpen, ChevronLeft, Clock, PlayCircle, Trophy, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClass();
  }, [id]);

  const loadClass = async () => {
    try {
      const res = await api.get<any>(`/classes/${id}`);
      setClassData(res.data);
    } catch (e: any) {
      toast.error('Failed to load class details');
      navigate('/student/classes');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!classData) return null;

  return (
    <div className="animate-fadeIn pb-8">
      {/* Header section similar to Google Classroom */}
      <div 
        className="rounded-xl overflow-hidden mb-6 relative"
        style={{ 
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          color: 'white',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ padding: 'var(--space-6) var(--space-8)' }}>
          <button 
            onClick={() => navigate('/student/classes')} 
            className="btn btn-ghost btn-icon mb-4" 
            style={{ color: 'white', opacity: 0.8 }}
          >
            <ChevronLeft size={24} />
          </button>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: 'white' }}>
            {classData.name}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0 0 var(--space-6) 0' }}>
            {classData.subject?.name} • Teacher: {classData.teacher?.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="tab-content">
        <div className="space-y-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2>Classwork & Quizzes</h2>
          </div>

          {classData.quizzes && classData.quizzes.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {classData.quizzes.map((quiz: any) => {
                // Determine if student has attempted this quiz.
                // Assuming we don't have this populated for students yet on this endpoint directly,
                // but the generic Take Quiz flow handles fetching attempt status.
                // For a polished UI, we might ideally join attempts in the query, but we can rely on TakeQuiz for now.
                
                return (
                  <div 
                    key={quiz.id} 
                    className="card hover-lift cursor-pointer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}
                    onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: '50%', 
                        background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                      }}>
                        <PlayCircle size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0 }}>{quiz.title}</h3>
                        <p className="text-sm text-muted" style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={14} /> 
                          {quiz.duration ? `${quiz.duration} mins` : 'Untimed'}
                          <span>•</span>
                          {quiz.mode} Mode
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <span className="badge badge-warning">{quiz.totalMarks} Marks</span>
                      <button className="btn btn-primary btn-sm">
                        Open
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state card">
              <CheckCircle size={48} style={{ color: 'var(--color-success)' }} />
              <h3>Woohoo, no work due in soon!</h3>
              <p>Your teacher hasn't posted any active quizzes for this class yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
