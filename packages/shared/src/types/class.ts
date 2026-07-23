// ===========================
// Class & Subject Types
// ===========================

export interface Department {
  id: string;
  name: string;
  code: string;
  subjects?: Subject[];
  createdAt: string;
}

export interface CreateDepartmentDTO {
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  semester?: number;
  createdAt: string;
}

export interface CreateSubjectDTO {
  name: string;
  code: string;
  departmentId: string;
  semester?: number;
}

export interface Class {
  id: string;
  name: string;
  subjectId: string;
  teacherId: string;
  joinCode: string;
  academicYear: string;
  section?: string;
  subject?: Subject;
  studentCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateClassDTO {
  name: string;
  subjectId: string;
  academicYear: string;
  section?: string;
}

export interface JoinClassDTO {
  joinCode: string;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
}
