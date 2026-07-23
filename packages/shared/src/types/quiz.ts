// ===========================
// Quiz, Question & Attempt Types
// ===========================

// ---------- Question Types ----------

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_BLANK = 'FILL_BLANK',
  MATCH = 'MATCH',
  NUMERICAL = 'NUMERICAL',
  DESCRIPTIVE = 'DESCRIPTIVE',
  CODING = 'CODING',
}

// ---------- Quiz Modes ----------

export enum QuizMode {
  PRACTICE = 'PRACTICE',       // Unlimited attempts
  TIMED = 'TIMED',             // One attempt, time-limited
  ASSIGNMENT = 'ASSIGNMENT',   // Available until deadline
  LIVE = 'LIVE',               // Real-time, teacher-started
}

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum DescriptiveGradingMode {
  MANUAL = 'MANUAL',
  AI_WITH_KEY = 'AI_WITH_KEY',       // AI + teacher answer key
  AI_WITHOUT_KEY = 'AI_WITHOUT_KEY', // AI generates rubric
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum BloomLevel {
  REMEMBER = 'REMEMBER',
  UNDERSTAND = 'UNDERSTAND',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
  EVALUATE = 'EVALUATE',
  CREATE = 'CREATE',
}

// ---------- Data Interfaces ----------

export interface Quiz {
  id: string;
  classId: string;
  title: string;
  description?: string;
  mode: QuizMode;
  status: QuizStatus;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  totalMarks: number;
  passingMarks?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showAnswers: boolean;
  maxAttempts: number;
  roomCode?: string; // For LIVE mode
  questions?: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizDTO {
  classId: string;
  title: string;
  description?: string;
  mode: QuizMode;
  startTime?: string;
  endTime?: string;
  duration?: number;
  passingMarks?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showAnswers?: boolean;
  maxAttempts?: number;
}

export interface Question {
  id: string;
  quizId?: string;
  type: QuestionType;
  questionText: string;
  marks: number;
  difficulty?: DifficultyLevel;
  bloomLevel?: BloomLevel;
  explanation?: string;
  imageUrl?: string;
  order: number;

  // Type-specific fields
  options?: Option[];             // MCQ, TRUE_FALSE
  acceptedAnswers?: string[];     // FILL_BLANK
  matchPairs?: MatchPair[];       // MATCH
  correctNumber?: number;         // NUMERICAL
  tolerance?: number;             // NUMERICAL
  idealAnswer?: string;           // DESCRIPTIVE
  gradingMode?: DescriptiveGradingMode; // DESCRIPTIVE
  testCases?: TestCase[];         // CODING
  starterCode?: string;           // CODING
  language?: string;              // CODING
}

export interface CreateQuestionDTO {
  type: QuestionType;
  questionText: string;
  marks: number;
  difficulty?: DifficultyLevel;
  bloomLevel?: BloomLevel;
  explanation?: string;
  imageUrl?: string;
  order?: number;

  options?: CreateOptionDTO[];
  acceptedAnswers?: string[];
  matchPairs?: CreateMatchPairDTO[];
  correctNumber?: number;
  tolerance?: number;
  idealAnswer?: string;
  gradingMode?: DescriptiveGradingMode;
  testCases?: CreateTestCaseDTO[];
  starterCode?: string;
  language?: string;
}

export interface Option {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface CreateOptionDTO {
  text: string;
  isCorrect: boolean;
  order?: number;
}

export interface MatchPair {
  id: string;
  questionId: string;
  leftItem: string;
  rightItem: string;
}

export interface CreateMatchPairDTO {
  leftItem: string;
  rightItem: string;
}

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CreateTestCaseDTO {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

// ---------- Attempt Interfaces ----------

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  TIMED_OUT = 'TIMED_OUT',
}

export interface StudentAttempt {
  id: string;
  studentId: string;
  quizId: string;
  status: AttemptStatus;
  score?: number;
  totalMarks: number;
  startedAt: string;
  submittedAt?: string;
  timeTaken?: number; // in seconds
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;            // JSON string for complex types
  isCorrect?: boolean;
  aiScore?: number;
  teacherScore?: number;
  finalScore: number;
  aiReasoning?: string;      // AI explanation
  teacherFeedback?: string;
}

export interface SubmitAnswerDTO {
  questionId: string;
  answer: string;
}

export interface SubmitQuizDTO {
  answers: SubmitAnswerDTO[];
}

// ---------- Question Bank ----------

export interface QuestionBankItem {
  id: string;
  teacherId: string;
  subject: string;
  topic: string;
  question: Question;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

export interface AddToQuestionBankDTO {
  subject: string;
  topic: string;
  question: CreateQuestionDTO;
  tags?: string[];
}
