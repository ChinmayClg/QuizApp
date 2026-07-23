// ===========================
// Quiz Results Page
// ===========================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuizResults() {
  const { attemptId } = useParams();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  const loadResult = async () => {
    try {
      const res = await api.get<any>(`/attempts/${attemptId}/result`);
      setResult(res.data);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !result) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  const percentage = result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0;

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Link to="/student" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-4)' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Score Card */}
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', marginBottom: 'var(--space-6)', background: 'var(--gradient-card)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: percentage >= 70 ? 'var(--color-success-bg)' : percentage >= 40 ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)' }}>
          <Trophy size={36} style={{ color: percentage >= 70 ? 'var(--color-success)' : percentage >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
        </div>

        <h1 style={{ fontSize: 'var(--font-size-5xl)', fontWeight: 900 }}>
          <span style={{ background: percentage >= 70 ? 'var(--gradient-success)' : 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {percentage}%
          </span>
        </h1>
        <p style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          {result.score || 0} / {result.totalMarks} marks
        </p>
        <h2 style={{ fontSize: 'var(--font-size-lg)' }}>{result.quiz?.title || 'Quiz'}</h2>
        <p className="text-sm text-muted">{result.quiz?.class?.subject?.name} • {result.quiz?.class?.name}</p>

        {result.timeTaken && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            <Clock size={16} />
            Completed in {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
          </div>
        )}
      </div>

      {/* Answer Review */}
      {result.answers && result.answers.length > 0 && (
        <div className="card">
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Answer Review</h2>
          {result.answers.map((answer: any, i: number) => (
            <div key={answer.id} className="card-glass" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                {answer.isCorrect ? (
                  <CheckCircle size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <XCircle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 2 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                    Q{i + 1}. {answer.question?.questionText}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    <span>Your answer: <strong style={{ color: 'var(--text-secondary)' }}>{answer.answer}</strong></span>
                    <span>Score: <strong style={{ color: answer.finalScore > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{answer.finalScore}/{answer.question?.marks}</strong></span>
                  </div>
                  {answer.aiReasoning && (
                    <p style={{ marginTop: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      💡 {answer.aiReasoning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
