// ===========================
// Dashboard Layout - Sidebar + Content
// ===========================

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingModal from '../auth/OnboardingModal';
import './DashboardLayout.css';

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <OnboardingModal />
      <Sidebar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
