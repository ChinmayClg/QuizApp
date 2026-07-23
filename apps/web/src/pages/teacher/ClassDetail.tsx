import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Users, BookOpen, Copy, PlusCircle, Trash2, Settings, ChevronLeft, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'students'>('quizzes');

  useEffect(() => {
    loadClass();
  }, [id]);

  const loadClass = async () => {
    try {
      const res = await api.get<any>(`/classes/${id}`);
      setClassData(res.data);
    } catch (e: any) {
      toast.error('Failed to load class details');
      navigate('/teacher/classes');
    } finally {
      setIsLoading(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await api.delete(`/classes/${id}/students/${studentId}`);
      toast.success('Student removed');
      loadClass();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove student');
    }
  };

  const copyCode = () => {
    if (classData?.joinCode) {
      navigator.clipboard.writeText(classData.joinCode);
      toast.success('Join code copied!');
    }
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!classData) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <span className="badge badge-success">Published</span>;
      case 'ACTIVE': return <span className="badge badge-primary">Active</span>;
      case 'COMPLETED': return <span className="badge badge-secondary">Completed</span>;
      default: return <span className="badge badge-secondary">Draft</span>;
    }
  };

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
            onClick={() => navigate('/teacher/classes')} 
            className="btn btn-ghost btn-icon mb-4" 
            style={{ color: 'white', opacity: 0.8 }}
          >
            <ChevronLeft size={24} />
          </button>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 var(--space-2) 0', color: 'white' }}>
            {classData.name}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: '0 0 var(--space-6) 0' }}>
            {classData.subject?.name} • Section {classData.section || 'A'}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: 'var(--space-2) var(--space-4)' }}>
              <Users size={16} style={{ marginRight: 'var(--space-2)' }} />
              {classData.enrollments.length} Students
            </div>
            <div 
              className="badge cursor-pointer hover:bg-opacity-30 transition-all" 
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: 'var(--space-2) var(--space-4)' }}
              onClick={copyCode}
              title="Copy Join Code"
            >
              <Copy size={16} style={{ marginRight: 'var(--space-2)' }} />
              Code: {classData.joinCode}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 'var(--space-4)', 
        borderBottom: '1px solid var(--border-color)',
        marginBottom: 'var(--space-6)'
      }}>
        <button 
          className={`btn btn-ghost ${activeTab === 'quizzes' ? 'active' : ''}`}
          style={{ 
            borderBottom: activeTab === 'quizzes' ? '2px solid var(--color-primary)' : '2px solid transparent',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            paddingBottom: 'var(--space-3)'
          }}
          onClick={() => setActiveTab('quizzes')}
        >
          <BookOpen size={18} style={{ marginRight: 'var(--space-2)' }} />
          Classwork (Quizzes)
        </button>
        <button 
          className={`btn btn-ghost ${activeTab === 'students' ? 'active' : ''}`}
          style={{ 
            borderBottom: activeTab === 'students' ? '2px solid var(--color-primary)' : '2px solid transparent',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            paddingBottom: 'var(--space-3)'
          }}
          onClick={() => setActiveTab('students')}
        >
          <Users size={18} style={{ marginRight: 'var(--space-2)' }} />
          People ({classData.enrollments.length})
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        
        {/* QUIZZES TAB */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2>Assigned Quizzes</h2>
              <button className="btn btn-primary" onClick={() => navigate('/teacher/quiz/create')}>
                <PlusCircle size={18} style={{ marginRight: 'var(--space-2)' }} />
                Create Quiz
              </button>
            </div>

            {classData.quizzes && classData.quizzes.length > 0 ? (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {classData.quizzes.map((quiz: any) => (
                  <div 
                    key={quiz.id} 
                    className="card hover-lift cursor-pointer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)' }}
                    onClick={() => navigate(`/teacher/quiz/${quiz.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div style={{ 
                        width: 48, height: 48, borderRadius: '50%', 
                        background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--color-primary)'
                      }}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0 }}>{quiz.title}</h3>
                        <p className="text-sm text-muted" style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} /> 
                          {new Date(quiz.createdAt).toLocaleDateString()}
                          <span>•</span>
                          {quiz.mode} Mode
                          <span>•</span>
                          {quiz.totalMarks} Marks
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      {getStatusBadge(quiz.status)}
                      <span className="text-sm text-muted">
                        {quiz._count?.attempts || 0} Attempts
                      </span>
                      <button className="btn btn-ghost btn-icon">
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state card">
                <BookOpen size={48} />
                <h3>No quizzes posted yet</h3>
                <p>Create an assignment or quiz for this class.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/teacher/quiz/create')}>
                  Create Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2>Class Roster</h2>
              <button className="btn btn-secondary" onClick={copyCode}>
                <Copy size={18} style={{ marginRight: 'var(--space-2)' }} />
                Copy Join Code
              </button>
            </div>

            {classData.enrollments.length > 0 ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--bg-glass)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData.enrollments.map((e: any) => (
                      <tr key={e.student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                              {e.student.name.charAt(0)}
                            </div>
                            {e.student.name}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)' }}>{e.student.email}</td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => removeStudent(e.student.id)}
                            title="Remove from class"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state card">
                <Users size={48} />
                <h3>No students enrolled</h3>
                <p>Share the join code <strong>{classData.joinCode}</strong> with your students.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
