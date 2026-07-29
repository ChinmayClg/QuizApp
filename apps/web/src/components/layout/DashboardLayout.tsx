// ===========================
// Dashboard Layout - Sidebar + Content
// ===========================

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Brain } from 'lucide-react';
import Sidebar from './Sidebar';
import OnboardingModal from '../auth/OnboardingModal';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <OnboardingModal />
      
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <Brain size={24} className="text-primary" />
          <span className="font-bold">QuizAI</span>
        </div>
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
