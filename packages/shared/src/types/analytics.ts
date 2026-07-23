// ===========================
// Analytics & Dashboard Types
// ===========================

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  totalStudents: number;
  attemptCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  passPercentage: number;
  averageTimeTaken: number; // seconds
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  type: string;
  correctPercentage: number;
  averageScore: number;
  totalAttempts: number;
  commonWrongAnswers: { answer: string; count: number }[];
}

export interface TeacherDashboard {
  totalClasses: number;
  totalStudents: number;
  totalQuizzes: number;
  activeQuizzes: number;
  recentQuizzes: QuizSummary[];
  classPerformance: ClassPerformance[];
}

export interface QuizSummary {
  id: string;
  title: string;
  className: string;
  status: string;
  attemptCount: number;
  averageScore: number;
  createdAt: string;
}

export interface ClassPerformance {
  classId: string;
  className: string;
  averageScore: number;
  studentCount: number;
  quizCount: number;
}

export interface StudentDashboard {
  overallAverage: number;
  totalQuizzesTaken: number;
  rank?: number;
  totalStudents?: number;
  recentAttempts: RecentAttempt[];
  weakTopics: TopicStrength[];
  strongTopics: TopicStrength[];
  progressData: ProgressPoint[];
  aiRecommendations: string[];
}

export interface RecentAttempt {
  quizId: string;
  quizTitle: string;
  className: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
}

export interface TopicStrength {
  topic: string;
  subject: string;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface ProgressPoint {
  date: string;
  score: number;
  quizTitle: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalDepartments: number;
  totalSubjects: number;
  totalQuizzes: number;
  totalAttempts: number;
  overallAverageScore: number;
  departmentAnalytics: DepartmentAnalytics[];
  recentActivity: ActivityItem[];
}

export interface DepartmentAnalytics {
  departmentId: string;
  departmentName: string;
  teacherCount: number;
  studentCount: number;
  quizCount: number;
  averageScore: number;
}

export interface ActivityItem {
  id: string;
  type: 'QUIZ_CREATED' | 'QUIZ_SUBMITTED' | 'USER_REGISTERED' | 'CLASS_CREATED';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
}

// ---------- AI Analytics ----------

export interface AIGradingResult {
  score: number;
  maxScore: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
}

export interface AIQuestionGenerationRequest {
  topic: string;
  subject: string;
  difficulty: string;
  count: number;
  types: string[];
  bloomLevels?: string[];
}

export interface AIQuestionGenerationResponse {
  questions: any[];
  metadata: {
    topic: string;
    difficulty: string;
    generatedAt: string;
  };
}

// ---------- API Response Wrapper ----------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
