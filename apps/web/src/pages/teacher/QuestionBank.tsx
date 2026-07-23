// ===========================
// Question Bank Page (Teacher)
// ===========================

import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Library, Sparkles, Search, PlusCircle, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuestionBank() {
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [aiForm, setAiForm] = useState({ topic: '', subject: '', difficulty: 'MEDIUM', count: 5, types: ['MCQ'], autoGradeSubjective: true });

  useEffect(() => {
    loadBank();
  }, []);

  const loadBank = async () => {
    try {
      const res = await api.get<any>('/questions/bank');
      setBankItems(res.data || []);
    } catch {} finally { setIsLoading(false); }
  };

  const generateWithAI = async () => {
    if (!aiForm.topic || !aiForm.subject) {
      toast.error('Please fill topic and subject');
      return;
    }
    setIsGenerating(true);
    try {
      const { autoGradeSubjective, ...apiPayload } = aiForm;
      const res = await api.post<any>('/ai/generate-questions', apiPayload);
      const questions = res.data || [];
      toast.success(`Generated ${questions.length} questions!`);

      // Add to bank
      for (const q of questions) {
        await api.post('/questions/bank', {
          subject: aiForm.subject,
          topic: aiForm.topic,
          type: q.type || 'MCQ',
          questionText: q.questionText,
          questionData: { ...q, gradingMode: q.type === 'DESCRIPTIVE' ? (aiForm.autoGradeSubjective ? 'AI_WITH_KEY' : 'MANUAL') : 'MANUAL' },
          difficulty: q.difficulty || 'MEDIUM',
          tags: [aiForm.topic],
        });
      }

      loadBank();
      setShowAI(false);
    } catch (e: any) {
      toast.error(e.message || 'AI generation failed');
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Question Bank 📖</h1>
        <p>Save and reuse questions across quizzes. Use AI to generate new ones.</p>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAI(true)}>
            <Sparkles size={18} /> Generate with AI
          </button>
        </div>
      </div>

      {bankItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Library size={48} />
            <h3>Question bank is empty</h3>
            <p>Save questions from quizzes or generate new ones with AI.</p>
            <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowAI(true)}>
              <Sparkles size={16} /> Generate Questions
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 40 }} 
              placeholder="Search by topic, subject, or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {(() => {
            const filteredItems = bankItems.filter(item => 
              item.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (item.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
              (item.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
            );

            const groupedItems = filteredItems.reduce((acc, item) => {
              const subject = item.subject || 'Uncategorized';
              if (!acc[subject]) acc[subject] = [];
              acc[subject].push(item);
              return acc;
            }, {} as Record<string, any[]>);

            return Object.entries(groupedItems).map(([subject, items]: [string, any]) => {
              const isExpanded = expandedSubjects.has(subject);
              return (
                <div key={subject} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <button 
                    className="btn btn-ghost w-full" 
                    style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 0, background: isExpanded ? 'var(--bg-glass)' : 'transparent' }}
                    onClick={() => {
                      const newSet = new Set(expandedSubjects);
                      if (isExpanded) newSet.delete(subject);
                      else newSet.add(subject);
                      setExpandedSubjects(newSet);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>{subject}</span>
                      <span className="badge badge-info">{items.length} questions</span>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {items.map((item: any) => (
                        <div key={item.id} className="card-glass hover-scale" style={{ padding: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                <span className="badge badge-primary">{item.type}</span>
                                {item.difficulty && <span className={`badge badge-${item.difficulty === 'EASY' ? 'success' : item.difficulty === 'HARD' ? 'danger' : 'warning'}`}>{item.difficulty}</span>}
                              </div>
                              <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{item.questionText}</p>
                              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                                Topic: {item.topic || 'General'} • Used {item.usageCount} times
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* AI Generate Modal */}
      {showAI && (
        <div className="modal-overlay" onClick={() => setShowAI(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Sparkles size={20} style={{ color: 'var(--color-primary-light)' }} />
                AI Question Generator
              </h2>
            </div>
            <div className="form-group">
              <label className="label">Subject</label>
              <input className="input" placeholder="e.g. Java Programming" value={aiForm.subject} onChange={(e) => setAiForm((p) => ({ ...p, subject: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">Topic</label>
              <input className="input" placeholder="e.g. Inheritance" value={aiForm.topic} onChange={(e) => setAiForm((p) => ({ ...p, topic: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Difficulty</label>
                <select className="input select" value={aiForm.difficulty} onChange={(e) => setAiForm((p) => ({ ...p, difficulty: e.target.value }))}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Number of Questions</label>
                <input type="number" className="input" value={aiForm.count} onChange={(e) => setAiForm((p) => ({ ...p, count: Number(e.target.value) }))} min={1} max={20} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">Question Types</label>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                {['MCQ', 'TRUE_FALSE', 'DESCRIPTIVE'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={aiForm.types.includes(type)}
                      onChange={(e) => {
                        const newTypes = e.target.checked 
                          ? [...aiForm.types, type] 
                          : aiForm.types.filter(t => t !== type);
                        setAiForm(p => ({ ...p, types: newTypes.length ? newTypes : ['MCQ'] }));
                      }}
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>
                      {type === 'TRUE_FALSE' ? 'True/False' : type === 'DESCRIPTIVE' ? 'Subjective' : 'MCQ'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {aiForm.types.includes('DESCRIPTIVE') && (
              <div className="form-group" style={{ marginBottom: 'var(--space-4)', background: 'var(--bg-glass)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={aiForm.autoGradeSubjective}
                    onChange={(e) => setAiForm(p => ({ ...p, autoGradeSubjective: e.target.checked }))}
                    style={{ width: 18, height: 18 }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: 'var(--font-size-sm)' }}>Auto-grade Subjective Answers</strong>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      AI will automatically check and grade descriptive answers based on its ideal answer key.
                    </span>
                  </div>
                </label>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAI(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={generateWithAI} disabled={isGenerating}>
                {isGenerating ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
                  <><Sparkles size={16} /> Generate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
