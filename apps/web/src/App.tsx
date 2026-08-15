// ===========================
// App Router - Role-Based Routing
// ===========================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentClasses from './pages/student/StudentClasses';
import StudentClassDetail from './pages/student/StudentClassDetail';
import StudentHistory from './pages/student/StudentHistory';
import CreateQuiz from './pages/teacher/CreateQuiz';
import EditQuiz from './pages/teacher/EditQuiz';
import QuizDetail from './pages/teacher/QuizDetail';
import TakeQuiz from './pages/student/TakeQuiz';
import QuizResults from './pages/student/QuizResults';
import ManageClasses from './pages/teacher/ManageClasses';
import ClassDetail from './pages/teacher/ClassDetail';
import ManageUsers from './pages/admin/ManageUsers';
import QuestionBank from './pages/teacher/QuestionBank';
import ProfilePage from './pages/common/ProfilePage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'ADMIN': return <Navigate to="/admin" />;
    case 'TEACHER': return <Navigate to="/teacher" />;
    case 'STUDENT': return <Navigate to="/student" />;
    default: return <Navigate to="/login" />;
  }
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

      {/* Dashboard Redirect */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute roles={['TEACHER']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<ManageClasses />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="quiz/create" element={<CreateQuiz />} />
        <Route path="quiz/edit/:id" element={<EditQuiz />} />
        <Route path="quiz/:id" element={<QuizDetail />} />
        <Route path="question-bank" element={<QuestionBank />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="classes" element={<StudentClasses />} />
        <Route path="classes/:id" element={<StudentClassDetail />} />
        <Route path="history" element={<StudentHistory />} />
        <Route path="quiz/:id" element={<TakeQuiz />} />
        <Route path="results/:attemptId" element={<QuizResults />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
