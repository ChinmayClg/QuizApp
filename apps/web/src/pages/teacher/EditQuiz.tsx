// ===========================
// Create Quiz Page - Multi-step Quiz Builder
// ===========================

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowRight, ArrowLeft, BookOpen, Clock, Settings, Save, PlusCircle, Trash2, Upload, FileText, Sparkles, Library, ChevronDown, ChevronRight, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { QuestionType } from '@quizai/shared';

interface QuestionDraft {
  type: QuestionType;
  questionText: string;
  marks: number;
  imageUrl?: string;
  options: { text: string; isCorrect: boolean }[];
  acceptedAnswers: string[];
  matchPairs: { leftItem: string; rightItem: string }[];
  correctNumber: number;
  tolerance: number;
  idealAnswer: string;
  gradingMode: string;
  explanation: string;
}

const emptyQuestion = (): QuestionDraft => ({
  type: QuestionType.MCQ,
  questionText: '',
  marks: 1,
  imageUrl: undefined,
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
  acceptedAnswers: [''],
  matchPairs: [{ leftItem: '', rightItem: '' }],
  correctNumber: 0,
  tolerance: 0,
  idealAnswer: '',
  gradingMode: 'MANUAL',
  explanation: '',
});

export default function EditQuiz() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoaded, setClassesLoaded] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    setIsLoading(true);
    api.get<any>(`/quizzes/${quizId}`).then((res) => {
      const q = res.data;
      setQuizData({
        classId: q.classId || '',
        title: q.title || '',
        description: q.description || '',
        mode: q.mode || 'TIMED',
        duration: q.duration || 30,
        startTime: q.startTime ? new Date(q.startTime).toISOString().slice(0, 16) : '',
        endTime: q.endTime ? new Date(q.endTime).toISOString().slice(0, 16) : '',
        shuffleQuestions: q.shuffleQuestions || false,
        shuffleOptions: q.shuffleOptions || false,
        showResults: q.showResults || true,
        showAnswers: q.showAnswers || false,
        maxAttempts: q.maxAttempts || 1,
      });
      if (q.questions && q.questions.length > 0) {
        setQuestions(q.questions.map((question: any) => ({
          ...emptyQuestion(),
          ...question,
          options: question.options && question.options.length > 0 ? question.options : emptyQuestion().options
        })));
      }
    }).catch((err: any) => {
      toast.error('Failed to load quiz');
      navigate('/teacher');
    }).finally(() => {
      setIsLoading(false);
    });
  }, [quizId]);

  // Quiz settings
  const [quizData, setQuizData] = useState({
    classId: '',
    title: '',
    description: '',
    mode: 'TIMED',
    duration: 30,
    startTime: '',
    endTime: '',
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: true,
    showAnswers: false,
    maxAttempts: 1,
  });

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [activeQ, setActiveQ] = useState(0);

  // AI Extraction State
  const [isUploading, setIsUploading] = useState(false);
  const [extractStrictly, setExtractStrictly] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('extractStrictly', String(extractStrictly));

    try {
      const res = await api.post<any>('/ai/parse-document', formData);
      
      const newQuestions = res.data.map((q: any) => ({
        ...emptyQuestion(),
        ...q
      }));
      
      setQuestions(prev => {
        if (prev.length === 1 && !prev[0].questionText) {
          return newQuestions;
        }
        return [...prev, ...newQuestions];
      });
      setActiveQ(questions.length > 0 && questions[0].questionText ? questions.length : 0);
      toast.success(`Successfully extracted ${newQuestions.length} questions!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to parse document');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // AI Prompt State
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', subject: '', difficulty: 'MEDIUM', count: 5, types: ['MCQ'], autoGradeSubjective: true });

  const generateWithAIPrompt = async () => {
    if (!aiForm.topic || !aiForm.subject) {
      toast.error('Please fill topic and subject');
      return;
    }
    setIsGenerating(true);
    try {
      const { autoGradeSubjective, ...apiPayload } = aiForm;
      const res = await api.post<any>('/ai/generate-questions', apiPayload);
      const newQuestions = res.data.map((q: any) => ({
        ...emptyQuestion(),
        ...q,
        gradingMode: q.type === 'DESCRIPTIVE' ? (aiForm.autoGradeSubjective ? 'AI_WITH_KEY' : 'MANUAL') : 'MANUAL'
      }));
      setQuestions(prev => {
        if (prev.length === 1 && !prev[0].questionText) return newQuestions;
        return [...prev, ...newQuestions];
      });
      setActiveQ(questions.length > 0 && questions[0].questionText ? questions.length : 0);
      toast.success(`Generated ${newQuestions.length} questions!`);
      setShowAIModal(false);
    } catch (e: any) {
      toast.error(e.message || 'AI generation failed');
    } finally { setIsGenerating(false); }
  };

  // Question Bank Import State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());
  const [expandedBankSubjects, setExpandedBankSubjects] = useState<Set<string>>(new Set());

  const openBankModal = async () => {
    setShowBankModal(true);
    setIsLoadingBank(true);
    try {
      const res = await api.get<any>('/questions/bank');
      setBankItems(res.data || []);
    } catch (e: any) {
      toast.error('Failed to load question bank');
    } finally { setIsLoadingBank(false); }
  };

  const importSelectedFromBank = () => {
    const selectedItems = bankItems.filter(item => selectedBankIds.has(item.id));
    const importedQuestions = selectedItems.map(item => ({
      ...emptyQuestion(),
      ...item.questionData
    }));
    
    setQuestions(prev => {
      if (prev.length === 1 && !prev[0].questionText) return importedQuestions;
      return [...prev, ...importedQuestions];
    });
    setActiveQ(questions.length > 0 && questions[0].questionText ? questions.length : 0);
    toast.success(`Imported ${importedQuestions.length} questions!`);
    setShowBankModal(false);
    setSelectedBankIds(new Set());
  };

  // Load classes
  if (!classesLoaded) {
    api.get<any>('/classes').then((res) => {
      setClasses(res.data || []);
      setClassesLoaded(true);
    }).catch(() => setClassesLoaded(true));
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setActiveQ(questions.length);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setActiveQ(Math.max(0, activeQ - 1));
  };

  const saveToBank = async (qIndex: number) => {
    const q = questions[qIndex];
    if (!q.questionText) {
      toast.error('Question text is required to save to bank');
      return;
    }
    
    const subject = window.prompt("Enter subject for this question:", "General");
    if (!subject) return;
    
    const topic = window.prompt("Enter topic for this question:", "General");
    if (!topic) return;

    try {
      const qData = { ...q };
      const normalizedType = q.type;
      
      await api.post('/questions/bank', {
        subject,
        topic,
        type: normalizedType,
        questionText: q.questionText,
        questionData: qData,
      });
      toast.success('Saved to Question Bank!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save to bank');
    }
  };

  const handleSubmit = async () => {
    if (!quizData.classId || !quizData.title) {
      toast.error('Please fill in quiz details');
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = { ...quizData };
      if (!payload.startTime) delete payload.startTime;
      else payload.startTime = new Date(payload.startTime).toISOString();
      
      if (!payload.endTime) delete payload.endTime;
      else payload.endTime = new Date(payload.endTime).toISOString();

      // 1. Update quiz
      await api.put(`/quizzes/${quizId}`, payload);

      // 2. Manage questions
      const existingRes = await api.get<any>(`/quizzes/${quizId}`);
      const existingQuestions = existingRes.data.questions || [];
      const stateQuestionIds = questions.map((q: any) => q.id).filter(Boolean);

      // Delete removed questions
      for (const eq of existingQuestions) {
        if (!stateQuestionIds.includes(eq.id)) {
          await api.delete(`/questions/${eq.id}`);
        }
      }

      // Create or update questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText) continue;

        const normalizedType = q.type;

        const qData: any = {
          quizId,
          type: normalizedType,
          questionText: q.questionText,
          marks: Number(q.marks) || 1,
          explanation: q.explanation || undefined,
          imageUrl: (q as any).imageUrl || undefined,
          order: i,
        };

        if (normalizedType === QuestionType.MCQ || normalizedType === QuestionType.TRUE_FALSE) {
          qData.options = (q.options || []).filter((o: any) => o.text).map((o: any, idx: number) => ({
            text: o.text,
            isCorrect: o.isCorrect === true || o.isCorrect === 'true',
            order: idx
          }));
        }
        if (q.type === QuestionType.FILL_BLANK) {
          qData.acceptedAnswers = (q.acceptedAnswers || []).filter((a: any) => a);
        }
        if (q.type === QuestionType.MATCH) {
          qData.matchPairs = (q.matchPairs || []).filter((p: any) => p.leftItem && p.rightItem);
        }
        if (q.type === QuestionType.NUMERICAL) {
          qData.correctNumber = Number(q.correctNumber) || 0;
          qData.tolerance = Number(q.tolerance) || 0;
        }
        if (q.type === 'DESCRIPTIVE') {
          qData.idealAnswer = q.idealAnswer;
          qData.gradingMode = q.gradingMode || 'MANUAL';
        }

        if ((q as any).id) {
          await api.put(`/questions/${(q as any).id}`, qData);
        } else {
          await api.post('/questions', qData);
        }
      }

      // 3. Complete
      toast.success('Quiz updated successfully! 🎉');
      navigate(`/teacher/quiz/${quizId}`);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg[0] : msg;
      toast.error(errorMsg || error.message || 'Failed to create quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const q = questions[activeQ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Edit Quiz ✨</h1>
        <p>Step {step} of 2 — {step === 1 ? 'Quiz Settings' : 'Add Questions'}</p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
        {[1, 2].map((s) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: s <= step ? 'var(--gradient-primary)' : 'var(--bg-glass)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {step === 1 && (
        <div className="card animate-fadeInUp" style={{ maxWidth: 700 }}>
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Quiz Settings</h2>

          <div className="form-group">
            <label className="label">Class *</label>
            <select className="input select" value={quizData.classId} onChange={(e) => setQuizData((prev) => ({ ...prev, classId: e.target.value }))}>
              <option value="">Select a class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} - {c.subject?.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Quiz Title *</label>
            <input className="input" placeholder="e.g. Midterm Exam - Java Fundamentals" value={quizData.title} onChange={(e) => setQuizData((prev) => ({ ...prev, title: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input textarea" placeholder="Optional description..." value={quizData.description} onChange={(e) => setQuizData((prev) => ({ ...prev, description: e.target.value }))} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Mode</label>
              <select className="input select" value={quizData.mode} onChange={(e) => setQuizData((prev) => ({ ...prev, mode: e.target.value }))}>
                <option value="TIMED">Timed</option>
                <option value="PRACTICE">Practice</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Duration (minutes)</label>
              <input type="number" className="input" value={quizData.duration} onChange={(e) => setQuizData((prev) => ({ ...prev, duration: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Start Time (Optional)</label>
              <input type="datetime-local" className="input" value={quizData.startTime} onChange={(e) => setQuizData((prev) => ({ ...prev, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="label">End Time (Optional)</label>
              <input type="datetime-local" className="input" value={quizData.endTime} onChange={(e) => setQuizData((prev) => ({ ...prev, endTime: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={quizData.shuffleQuestions} onChange={(e) => setQuizData((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))} />
              Shuffle Questions
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={quizData.shuffleOptions} onChange={(e) => setQuizData((prev) => ({ ...prev, shuffleOptions: e.target.checked }))} />
              Shuffle Options
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-primary" onClick={() => {
              if (!quizData.classId || !quizData.title) {
                toast.error('Please select a class and enter a title');
                return;
              }
              setStep(2);
            }}>
              Next: Add Questions <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-6)' }}>
          {/* Question sidebar */}
          <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>Questions ({questions.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {questions.map((_, i) => (
                <button key={i} className={`btn ${i === activeQ ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveQ(i)} style={{ justifyContent: 'flex-start' }}>
                  Q{i + 1} - {questions[i].type}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm w-full" onClick={addQuestion} style={{ marginTop: 'var(--space-4)' }}>
              <PlusCircle size={14} /> Add Question
            </button>
            <button className="btn btn-ghost btn-sm w-full" onClick={openBankModal} style={{ marginTop: 'var(--space-2)' }}>
              <Library size={14} /> Import from Bank
            </button>
            
            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>AI GENERATOR</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 'var(--space-3)' }}>
                <input type="checkbox" checked={extractStrictly} onChange={(e) => setExtractStrictly(e.target.checked)} />
                Format existing quiz
              </label>
              
              <label className="btn btn-secondary btn-sm w-full" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', justifyContent: 'center' }}>
                {isUploading ? (
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                ) : (
                  <><Upload size={14} /> {extractStrictly ? 'Upload Quiz' : 'Upload Notes'}</>
                )}
                <input type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
              </label>
              <button className="btn btn-ghost btn-sm w-full" onClick={() => setShowAIModal(true)} style={{ marginTop: 'var(--space-2)', justifyContent: 'center' }}>
                <Sparkles size={14} /> Generate from Topic
              </button>
            </div>
          </div>

          {/* Question editor */}
          <div className="card animate-fadeIn" key={activeQ}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2>Question {activeQ + 1}</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => saveToBank(activeQ)}>
                  <Library size={14} /> Save to Bank
                </button>
                {questions.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => removeQuestion(activeQ)}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Question Type</label>
                <select className="input select" value={q.type} onChange={(e) => updateQuestion(activeQ, 'type', e.target.value)}>
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True/False</option>
                  <option value="FILL_BLANK">Fill in the Blank</option>
                  <option value="MATCH">Match the Following</option>
                  <option value="NUMERICAL">Numerical</option>
                  <option value="DESCRIPTIVE">Descriptive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Marks</label>
                <input type="number" className="input" value={q.marks} onChange={(e) => updateQuestion(activeQ, 'marks', Number(e.target.value))} min={1} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Question Text *</label>
              <textarea className="input textarea" placeholder="Enter your question..." value={q.questionText} onChange={(e) => updateQuestion(activeQ, 'questionText', e.target.value)} />
            </div>

            {/* Question Image Upload */}
            <div className="form-group">
              <label className="label">Question Image (optional)</label>
              {q.imageUrl ? (
                <div style={{ position: 'relative', display: 'inline-block', marginTop: 'var(--space-2)' }}>
                  <img
                    src={q.imageUrl}
                    alt="Question"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 250,
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-primary)',
                      objectFit: 'contain',
                    }}
                  />
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => updateQuestion(activeQ, 'imageUrl', undefined)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-full)',
                      minWidth: 'unset',
                    }}
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label
                  className="btn btn-secondary btn-sm"
                  style={{ cursor: 'pointer', display: 'inline-flex', marginTop: 'var(--space-2)' }}
                >
                  <ImagePlus size={16} /> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        toast.loading('Uploading image...', { id: 'img-upload' });
                        const res = await api.post<any>('/upload/image', formData);
                        updateQuestion(activeQ, 'imageUrl', res.url);
                        toast.success('Image uploaded!', { id: 'img-upload' });
                      } catch (err: any) {
                        toast.error(err.message || 'Image upload failed', { id: 'img-upload' });
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>

            {/* MCQ Options */}
            {(q.type === 'MCQ' || q.type === 'TRUE_FALSE') && (
              <div className="form-group">
                <label className="label">Options (check the correct answer)</label>
                {q.options.map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <input
                      type="radio"
                      name={`correct-${activeQ}`}
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = q.options.map((o, i) => ({ ...o, isCorrect: i === oi }));
                        updateQuestion(activeQ, 'options', updated);
                      }}
                    />
                    <input
                      className="input"
                      placeholder={`Option ${oi + 1}`}
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...q.options];
                        updated[oi].text = e.target.value;
                        updateQuestion(activeQ, 'options', updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Fill Blank */}
            {q.type === 'FILL_BLANK' && (
              <div className="form-group">
                <label className="label">Accepted Answers</label>
                {q.acceptedAnswers.map((ans, ai) => (
                  <div key={ai} style={{ marginBottom: 'var(--space-2)' }}>
                    <input
                      className="input"
                      placeholder={`Accepted answer ${ai + 1}`}
                      value={ans}
                      onChange={(e) => {
                        const updated = [...q.acceptedAnswers];
                        updated[ai] = e.target.value;
                        updateQuestion(activeQ, 'acceptedAnswers', updated);
                      }}
                    />
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => updateQuestion(activeQ, 'acceptedAnswers', [...q.acceptedAnswers, ''])}>
                  + Add Answer
                </button>
              </div>
            )}

            {/* Match */}
            {q.type === 'MATCH' && (
              <div className="form-group">
                <label className="label">Match Pairs</label>
                {q.matchPairs.map((pair, pi) => (
                  <div key={pi} className="form-row" style={{ marginBottom: 'var(--space-2)' }}>
                    <input className="input" placeholder="Left item" value={pair.leftItem} onChange={(e) => {
                      const updated = [...q.matchPairs];
                      updated[pi].leftItem = e.target.value;
                      updateQuestion(activeQ, 'matchPairs', updated);
                    }} />
                    <input className="input" placeholder="Right item" value={pair.rightItem} onChange={(e) => {
                      const updated = [...q.matchPairs];
                      updated[pi].rightItem = e.target.value;
                      updateQuestion(activeQ, 'matchPairs', updated);
                    }} />
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => updateQuestion(activeQ, 'matchPairs', [...q.matchPairs, { leftItem: '', rightItem: '' }])}>
                  + Add Pair
                </button>
              </div>
            )}

            {/* Numerical */}
            {q.type === 'NUMERICAL' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Correct Number</label>
                  <input type="number" step="any" className="input" value={q.correctNumber} onChange={(e) => updateQuestion(activeQ, 'correctNumber', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="label">Tolerance (±)</label>
                  <input type="number" step="any" className="input" value={q.tolerance} onChange={(e) => updateQuestion(activeQ, 'tolerance', Number(e.target.value))} />
                </div>
              </div>
            )}

            {/* Descriptive */}
            {q.type === 'DESCRIPTIVE' && (
              <>
                <div className="form-group">
                  <label className="label">Grading Mode</label>
                  <select className="input select" value={q.gradingMode} onChange={(e) => updateQuestion(activeQ, 'gradingMode', e.target.value)}>
                    <option value="MANUAL">Manual Checking</option>
                    <option value="AI_WITH_KEY">AI (with answer key)</option>
                    <option value="AI_WITHOUT_KEY">AI (auto rubric)</option>
                  </select>
                </div>
                {q.gradingMode !== 'AI_WITHOUT_KEY' && (
                  <div className="form-group">
                    <label className="label">Ideal Answer</label>
                    <textarea className="input textarea" placeholder="The ideal/reference answer..." value={q.idealAnswer} onChange={(e) => updateQuestion(activeQ, 'idealAnswer', e.target.value)} />
                  </div>
                )}
              </>
            )}

            {/* Explanation */}
            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="label">Explanation (shown after grading)</label>
              <textarea className="input textarea" placeholder="Why this answer is correct..." value={q.explanation} onChange={(e) => updateQuestion(activeQ, 'explanation', e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      {step === 2 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
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
              <button className="btn btn-secondary" onClick={() => setShowAIModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={generateWithAIPrompt} disabled={isGenerating}>
                {isGenerating ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
                  <><Sparkles size={16} /> Generate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Import Modal */}
      {showBankModal && (
        <div className="modal-overlay" onClick={() => setShowBankModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Library size={20} style={{ color: 'var(--color-primary-light)' }} />
                Import from Question Bank
              </h2>
            </div>
            
            {isLoadingBank ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" />
              </div>
            ) : bankItems.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                Your question bank is empty.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                {(() => {
                  const groupedItems = bankItems.reduce((acc, item) => {
                    const subject = item.subject || 'Uncategorized';
                    if (!acc[subject]) acc[subject] = [];
                    acc[subject].push(item);
                    return acc;
                  }, {} as Record<string, any[]>);

                  return Object.entries(groupedItems).map(([subject, items]: [string, any]) => {
                    const isExpanded = expandedBankSubjects.has(subject);
                    return (
                      <div key={subject} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <button 
                          className="btn btn-ghost w-full" 
                          style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', borderRadius: 0, background: isExpanded ? 'var(--bg-glass)' : 'transparent' }}
                          onClick={() => {
                            const newSet = new Set(expandedBankSubjects);
                            if (isExpanded) newSet.delete(subject);
                            else newSet.add(subject);
                            setExpandedBankSubjects(newSet);
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
                              <label key={item.id} className="card-glass hover-scale" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', cursor: 'pointer', padding: 'var(--space-3)' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedBankIds.has(item.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedBankIds);
                                    if (e.target.checked) newSet.add(item.id);
                                    else newSet.delete(item.id);
                                    setSelectedBankIds(newSet);
                                  }}
                                />
                                <div>
                                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                    <span className="badge badge-primary" style={{ fontSize: 10 }}>{item.type}</span>
                                  </div>
                                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{item.questionText}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            
            <div className="modal-actions" style={{ marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setShowBankModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={importSelectedFromBank} disabled={selectedBankIds.size === 0}>
                Import Selected ({selectedBankIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
