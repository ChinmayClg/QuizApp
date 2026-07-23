// ===========================
// Manage Classes Page (Teacher)
// ===========================

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { BookOpen, PlusCircle, Copy, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ManageClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [formData, setFormData] = useState({ name: '', subjectId: '', subjectName: '', academicYear: '2025-26', section: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classRes, subjectRes] = await Promise.all([
        api.get<any>('/classes'),
        api.get<any>('/subjects'),
      ]);
      setClasses(classRes.data || []);
      setSubjects(subjectRes.data || []);
    } catch {} finally { setIsLoading(false); }
  };

  const createClass = async () => {
    if (!formData.name || (!isNewSubject && !formData.subjectId) || (isNewSubject && !formData.subjectName)) {
      toast.error('Please fill name and subject');
      return;
    }
    try {
      const payload = isNewSubject ? { ...formData, subjectId: undefined } : { ...formData, subjectName: undefined };
      await api.post('/classes', payload);
      toast.success('Class created!');
      setShowCreate(false);
      setIsNewSubject(false);
      setFormData({ name: '', subjectId: '', subjectName: '', academicYear: '2025-26', section: '' });
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deleteClass = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This will delete all associated quizzes and attempts. This action cannot be undone.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted successfully!');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete class');
    }
  };

  // removeStudent & loadClassStudents moved to ClassDetail

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Join code copied!');
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>My Classes 📚</h1>
        <p>Manage your classes and share join codes with students.</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <PlusCircle size={18} /> Create Class
          </button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No classes yet</h3>
            <p>Create your first class to start adding quizzes.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {classes.map((c: any) => (
            <div key={c.id} className="card hover-lift">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{c.name}</h3>
                <span className="badge badge-primary">{c.section || 'All'}</span>
              </div>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                {c.subject?.name} • {c.academicYear}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                <span><Users size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {c.studentCount || 0} students</span>
                <span><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {c.quizCount || 0} quizzes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Join Code:</span>
                <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary-light)', flex: 1 }}>{c.joinCode}</code>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => copyCode(c.joinCode)}>
                  <Copy size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-secondary w-full" onClick={() => navigate(`/teacher/classes/${c.id}`)}>
                  Open Class
                </button>
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => deleteClass(c.id)}>
                  <X size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Class</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="form-group">
              <label className="label">Class Name</label>
              <input className="input" placeholder="e.g. Java Programming Batch A" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Subject</label>
              {!isNewSubject ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="input select" style={{ flex: 1 }} value={formData.subjectId} onChange={(e) => setFormData((p) => ({ ...p, subjectId: e.target.value }))}>
                    <option value="">Select subject</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                  <button className="btn btn-secondary" onClick={() => { setIsNewSubject(true); setFormData(p => ({...p, subjectId: '', subjectName: ''})) }}>New</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input" style={{ flex: 1 }} placeholder="Type new subject name..." value={formData.subjectName || ''} onChange={(e) => setFormData((p) => ({ ...p, subjectName: e.target.value }))} />
                  <button className="btn btn-secondary" onClick={() => { setIsNewSubject(false); setFormData(p => ({...p, subjectId: '', subjectName: ''})) }}>Cancel</button>
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Academic Year</label>
                <input className="input" value={formData.academicYear} onChange={(e) => setFormData((p) => ({ ...p, academicYear: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Section</label>
                <input className="input" placeholder="A, B, C..." value={formData.section} onChange={(e) => setFormData((p) => ({ ...p, section: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createClass}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
