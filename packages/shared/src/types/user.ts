// ===========================
// User Types & Enums
// ===========================

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  department?: string;
  enrollmentNumber?: string; // For students
  employeeId?: string; // For teachers
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateUserDTO {
  name?: string;
  department?: string;
  profileImage?: string;
}

export interface UserStats {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  activeUsers: number;
}
