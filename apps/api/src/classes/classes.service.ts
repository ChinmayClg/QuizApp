// ===========================
// Classes & Subjects Service
// ===========================

import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  // ========== DEPARTMENTS ==========

  async createDepartment(data: { name: string; code: string }) {
    const existing = await this.prisma.department.findFirst({
      where: { OR: [{ name: data.name }, { code: data.code }] },
    });
    if (existing) throw new ConflictException('Department name or code already exists');

    return this.prisma.department.create({ data });
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      include: { subjects: true },
      orderBy: { name: 'asc' },
    });
  }

  async deleteDepartment(id: string) {
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted' };
  }

  // ========== SUBJECTS ==========

  async createSubject(data: { name: string; code: string; departmentId: string; semester?: number }) {
    const existing = await this.prisma.subject.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('Subject code already exists');

    return this.prisma.subject.create({
      data,
      include: { department: true },
    });
  }

  async getSubjects(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    return this.prisma.subject.findMany({
      where,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async deleteSubject(id: string) {
    await this.prisma.subject.delete({ where: { id } });
    return { message: 'Subject deleted' };
  }

  // ========== CLASSES ==========

  async createClass(teacherId: string, data: { name: string; subjectId?: string; subjectName?: string; academicYear: string; section?: string }) {
    let actualSubjectId = data.subjectId;

    if (!actualSubjectId && data.subjectName) {
      let defaultDept = await this.prisma.department.findFirst({ where: { name: 'General' } });
      if (!defaultDept) {
        defaultDept = await this.prisma.department.create({ data: { name: 'General', code: 'GEN' } });
      }

      let subject = await this.prisma.subject.findFirst({ where: { name: { equals: data.subjectName, mode: 'insensitive' } } });
      if (!subject) {
        const code = data.subjectName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
        subject = await this.prisma.subject.create({
          data: {
            name: data.subjectName,
            code,
            departmentId: defaultDept.id,
          }
        });
      }
      actualSubjectId = subject.id;
    }

    if (!actualSubjectId) {
      throw new ConflictException('Either subjectId or subjectName must be provided');
    }

    const joinCode = nanoid(7).toUpperCase();

    const classItem = await this.prisma.class.create({
      data: {
        name: data.name,
        academicYear: data.academicYear,
        section: data.section,
        subjectId: actualSubjectId,
        teacherId,
        joinCode,
      },
      include: {
        subject: { include: { department: true } },
      },
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        userId: teacherId,
        type: 'CLASS_CREATED',
        description: `Created class: ${classItem.name}`,
      },
    });

    return classItem;
  }

  async getTeacherClasses(teacherId: string) {
    const classes = await this.prisma.class.findMany({
      where: { teacherId, isActive: true },
      include: {
        subject: { include: { department: true } },
        _count: { select: { enrollments: true, quizzes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((c) => ({
      ...c,
      studentCount: c._count.enrollments,
      quizCount: c._count.quizzes,
    }));
  }

  async getStudentClasses(studentId: string) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            subject: { include: { department: true } },
            teacher: { select: { id: true, name: true, email: true } },
            _count: { select: { enrollments: true, quizzes: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => ({
      ...e.class,
      studentCount: e.class._count.enrollments,
      quizCount: e.class._count.quizzes,
      enrolledAt: e.enrolledAt,
    }));
  }

  async getClassById(id: string, role?: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id },
      include: {
        subject: { include: { department: true } },
        teacher: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true, enrollmentNumber: true } },
          },
        },
        quizzes: {
          where: role === 'STUDENT' ? { status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'] } } : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { attempts: true } }
          }
        },
        _count: { select: { quizzes: true } },
      },
    });

    if (!classItem) throw new NotFoundException('Class not found');
    return classItem;
  }

  async joinClass(studentId: string, joinCode: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { joinCode },
      include: { subject: true },
    });

    if (!classItem) throw new NotFoundException('Invalid class code');
    if (!classItem.isActive) throw new ForbiddenException('This class is no longer active');

    // Check if already enrolled
    const existing = await this.prisma.classEnrollment.findUnique({
      where: { classId_studentId: { classId: classItem.id, studentId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this class');

    await this.prisma.classEnrollment.create({
      data: { classId: classItem.id, studentId },
    });

    return { message: `Joined ${classItem.name} successfully`, class: classItem };
  }

  async leaveClass(studentId: string, classId: string) {
    await this.prisma.classEnrollment.delete({
      where: { classId_studentId: { classId, studentId } },
    });
    return { message: 'Left class successfully' };
  }

  async removeStudent(classId: string, studentId: string, teacherId: string) {
    const classItem = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classItem) throw new NotFoundException('Class not found');
    if (classItem.teacherId !== teacherId) throw new ForbiddenException('Not your class');

    await this.prisma.classEnrollment.delete({
      where: { classId_studentId: { classId, studentId } },
    });
    return { message: 'Student removed' };
  }

  async deleteClass(classId: string, teacherId: string) {
    const classItem = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!classItem) throw new NotFoundException('Class not found');
    if (classItem.teacherId !== teacherId) throw new ForbiddenException('Not your class');

    await this.prisma.class.delete({ where: { id: classId } });
    return { message: 'Class deleted successfully' };
  }

  async getAllClasses() {
    return this.prisma.class.findMany({
      include: {
        subject: { include: { department: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, quizzes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
