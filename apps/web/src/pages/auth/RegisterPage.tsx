// ===========================
// Register Page
// ===========================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, User, Mail, Lock, Hash, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import './AuthPages.css';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'STUDENT',
    department: '',
    enrollmentNumber: '',
    employeeId: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        department: formData.department || undefined,
        enrollmentNumber: formData.enrollmentNumber || undefined,
        employeeId: formData.employeeId || undefined,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container auth-container-wide animate-fadeInUp">
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <Brain size={40} />
            </div>
            <h1>QuizAI</h1>
            <p className="auth-tagline">
              Join the future of academic assessment
            </p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" id="register-form">
            <div className="form-group">
              <label className="label" htmlFor="register-name">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  className="input input-with-icon"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="register-email">College Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  className="input input-with-icon"
                  placeholder="you@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="register-role">I am a</label>
              <select
                id="register-role"
                name="role"
                className="input select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label" htmlFor="register-password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    className="input input-with-icon"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="register-confirm">Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="register-confirm"
                    name="confirmPassword"
                    type="password"
                    className="input input-with-icon"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="register-dept">Department (optional)</label>
              <div className="input-wrapper">
                <Building2 size={18} className="input-icon" />
                <input
                  id="register-dept"
                  name="department"
                  type="text"
                  className="input input-with-icon"
                  placeholder="e.g. Computer Science"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            </div>

            {formData.role === 'STUDENT' && (
              <div className="form-group">
                <label className="label" htmlFor="register-enrollment">Enrollment Number</label>
                <div className="input-wrapper">
                  <Hash size={18} className="input-icon" />
                  <input
                    id="register-enrollment"
                    name="enrollmentNumber"
                    type="text"
                    className="input input-with-icon"
                    placeholder="e.g. 2024CS001"
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading}
              id="register-submit"
            >
              {isLoading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            <div className="auth-divider">
              <span>OR</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setIsLoading(true);
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      toast.success('Registration successful!');
                      navigate('/dashboard');
                    } catch (error: any) {
                      toast.error(error.message || 'Google registration failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                onError={() => {
                  toast.error('Google registration failed');
                }}
              />
            </div>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
