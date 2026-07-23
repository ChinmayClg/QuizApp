import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hash, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import './OnboardingModal.css';

export default function OnboardingModal() {
  const { user } = useAuth();
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only show for students who don't have an enrollment number
  if (!user || user.role !== 'STUDENT' || user.enrollmentNumber) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollmentNumber.trim()) {
      toast.error('Please enter your enrollment number');
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/users/${user.id}`, { enrollmentNumber });
      
      // Update local storage and context
      const updatedUser = { ...user, enrollmentNumber };
      localStorage.setItem('quizai_user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      window.location.reload(); // Quick way to sync context state
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-icon-wrapper">
            <Hash size={24} />
          </div>
          <h2 className="onboarding-title">Welcome to QuizAI!</h2>
          <p className="onboarding-desc">
            Please enter your seat number (enrollment number) to continue to your dashboard.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="onboarding-body">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="enrollmentNumber" className="label">
              Seat / Enrollment Number
            </label>
            <div className="input-wrapper">
              <Hash size={18} className="input-icon" />
              <input
                id="enrollmentNumber"
                type="text"
                className="input input-with-icon"
                placeholder="e.g. 2024CS001"
                value={enrollmentNumber}
                onChange={(e) => setEnrollmentNumber(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg w-full"
          >
            {isLoading ? (
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
