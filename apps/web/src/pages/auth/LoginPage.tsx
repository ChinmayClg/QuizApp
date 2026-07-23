// ===========================
// Login Page - Premium Glassmorphism Design
// ===========================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import './AuthPages.css';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Content */}
      <div className="auth-container animate-fadeInUp">
        {/* Left Panel - Branding */}
        <div className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <Brain size={40} />
            </div>
            <h1>QuizAI</h1>
            <p className="auth-tagline">
              AI-Powered Assessment Platform
            </p>
            <div className="auth-features">
              <div className="auth-feature">
                <Sparkles size={18} />
                <span>AI-powered grading & feedback</span>
              </div>
              <div className="auth-feature">
                <Sparkles size={18} />
                <span>7+ question types supported</span>
              </div>
              <div className="auth-feature">
                <Sparkles size={18} />
                <span>Real-time analytics & insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div className="form-group">
              <label className="label" htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="input input-with-icon"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type="password"
                  className="input input-with-icon"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>
                  Sign In
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
                      toast.success('Welcome back!');
                      navigate('/dashboard');
                    } catch (error: any) {
                      toast.error(error.message || 'Google login failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                onError={() => {
                  toast.error('Google login failed');
                }}
                useOneTap
              />
            </div>
          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
