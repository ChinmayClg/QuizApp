// ===========================
// Sidebar Navigation - Role-Aware
// ===========================

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, FileQuestion, GraduationCap,
  BarChart3, Settings, LogOut, PlusCircle, Library, FolderOpen,
  Brain, Sparkles
} from 'lucide-react';
import './Sidebar.css';

const navItems = {
  ADMIN: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
  ],
  TEACHER: [
    { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/teacher/classes', icon: BookOpen, label: 'My Classes' },
    { to: '/teacher/quiz/create', icon: PlusCircle, label: 'Create Quiz' },
    { to: '/teacher/question-bank', icon: Library, label: 'Question Bank' },
    { to: '/teacher/profile', icon: Settings, label: 'Profile' },
  ],
  STUDENT: [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/classes', icon: BookOpen, label: 'My Classes' },
    { to: '/student/history', icon: BookOpen, label: 'Quiz History' },
    { to: '/student/profile', icon: Settings, label: 'Profile' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = navItems[user.role] || [];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Brain size={24} />
        </div>
        <div className="logo-text">
          <span className="logo-name">QuizAI</span>
          <span className="logo-tagline">Smart Assessment</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">Menu</span>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role.toLowerCase()}</span>
          </div>
        </div>
        <button onClick={logout} className="btn-logout" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
