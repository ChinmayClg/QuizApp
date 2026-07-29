// ===========================
// Take Quiz - Student Quiz-Taking Experience
// ===========================

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Clock, ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './TakeQuiz.css';

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    startQuiz();
  }, [id]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Cheat Detection (Tab Switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        toast.error('Warning: Tab switching is not allowed during the quiz!', {
          duration: 5000,
          icon: '⚠️',
        });
        // Optional: you could add an API call here to log the cheat attempt
        if (attempt) {
          // Fire-and-forget log to backend (if backend supports it)
          api.post(`/attempts/${attempt.id}/log-warning`, { type: 'TAB_SWITCH' }).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attempt, isSubmitting]);

  const startQuiz = async () => {
    try {
      const quizRes = await api.get<any>(`/quizzes/${id}`);
      setQuiz(quizRes.data);

      const attemptRes = await api.post<any>(`/attempts/start/${id}`);
      setAttempt(attemptRes.data);

      if (attemptRes.data.answers) {
        const initialAnswers: Record<string, string> = {};
        attemptRes.data.answers.forEach((ans: any) => {
          initialAnswers[ans.questionId] = ans.answer;
        });
        setAnswers(initialAnswers);
      }

      if (quizRes.data.duration) {
        const durationSeconds = quizRes.data.duration * 60;
        const startedAt = new Date(attemptRes.data.startedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const remainingSeconds = durationSeconds - elapsedSeconds;
        
        setTimeLeft(Math.max(0, remainingSeconds));
      }
    } catch (error: any) {
      toast.error(error.message || 'Cannot start quiz');
      navigate('/student');
    } finally {
      setIsLoading(false);
    }
  };

  const setAnswer = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Auto-save
    if (attempt) {
      api.post(`/attempts/${attempt.id}/save-answer`, { questionId, answer: value }).catch(() => {});
    }
  }, [attempt]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const answerList = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const res = await api.post<any>(`/attempts/${attempt.id}/submit`, { answers: answerList });
      toast.success(`Quiz submitted! Score: ${res.data.score}/${res.data.totalMarks}`);
      navigate(`/student/results/${attempt.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit');
      setIsSubmitting(false);
    }
  };

  if (isLoading || !quiz) {
    return <div className="loading-screen"><div className="spinner" /><p className="text-muted">Loading quiz...</p></div>;
  }

  const questions = quiz.questions || [];
  const question = questions[currentQ];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="animate-fadeIn take-quiz-container">
      {/* Header */}
      <div className="take-quiz-header">
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)' }}>{quiz.title}</h2>
          <p className="text-sm text-muted">{questions.length} questions • {quiz.totalMarks} marks</p>
        </div>
        {timeLeft !== null && (
          <div className={`quiz-timer ${timeLeft < 300 ? 'danger' : ''}`}>
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Question */}
      {question && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <span className="badge badge-primary">Q{currentQ + 1} of {questions.length}</span>
            <span className="badge badge-info">{question.marks} marks • {question.type}</span>
          </div>

          <h3 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)', lineHeight: 'var(--line-height-relaxed)' }}>
            {question.questionText}
          </h3>

          {/* Question Image */}
          {question.imageUrl && (
            <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
              <img
                src={question.imageUrl}
                alt="Question diagram"
                style={{
                  maxWidth: '100%',
                  maxHeight: 350,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-primary)',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* MCQ / True-False */}
          {(question.type === 'MCQ' || question.type === 'TRUE_FALSE') && question.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {question.options.map((opt: any) => (
                <button
                  key={opt.id}
                  className={`card-glass hover-scale quiz-option ${answers[question.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => setAnswer(question.id, opt.id)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {/* Fill Blank */}
          {question.type === 'FILL_BLANK' && (
            <input
              className="input quiz-input"
              placeholder="Type your answer..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
            />
          )}

          {/* Numerical */}
          {question.type === 'NUMERICAL' && (
            <input
              type="number"
              step="any"
              className="input quiz-input"
              placeholder="Enter your numerical answer..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
            />
          )}

          {/* Descriptive */}
          {question.type === 'DESCRIPTIVE' && (
            <textarea
              className="input textarea quiz-textarea"
              placeholder="Write your answer..."
              value={answers[question.id] || ''}
              onChange={(e) => setAnswer(question.id, e.target.value)}
            />
          )}

          {/* Match */}
          {question.type === 'MATCH' && (
            <p className="text-muted text-sm">Match-the-following questions will be supported in the next update.</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="quiz-navigation">
        <button className="btn btn-secondary nav-btn" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)}>
          <ChevronLeft size={16} /> <span className="nav-text">Previous</span>
        </button>

        {/* Question dots */}
        <div className="question-dots-container">
          {questions.map((_: any, i: number) => {
            const isAnswered = !!answers[questions[i].id];
            const isCurrent = i === currentQ;
            let dotClass = 'question-dot';
            if (isCurrent) dotClass += ' current';
            else if (isAnswered) dotClass += ' answered';

            return (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={dotClass}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {currentQ < questions.length - 1 ? (
          <button className="btn btn-primary nav-btn" onClick={() => setCurrentQ((p) => p + 1)}>
            <span className="nav-text">Next</span> <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary nav-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
              <><Send size={16} /> <span className="nav-text">Submit Quiz</span></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
