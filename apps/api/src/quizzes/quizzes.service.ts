// ===========================
// Quizzes Service - Full Quiz Lifecycle
// ===========================

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizMode, QuizStatus } from '@quizai/database';
import { nanoid } from 'nanoid';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, data: {
    classId: string;
    title: string;
    description?: string;
    mode: QuizMode;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    passingMarks?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResults?: boolean;
    showAnswers?: boolean;
    maxAttempts?: number;
    hasNegativeMarking?: boolean;
    negativeMarksValue?: number;
  }) {
    // Verify teacher owns the class
    const classItem = await this.prisma.class.findUnique({ where: { id: data.classId } });
    if (!classItem) throw new NotFoundException('Class not found');
    if (classItem.teacherId !== teacherId) throw new ForbiddenException('Not your class');

    const quiz = await this.prisma.quiz.create({
      data: {
        ...data,
        roomCode: data.mode === 'LIVE' ? nanoid(7).toUpperCase() : undefined,
      },
      include: {
        class: { include: { subject: true } },
      },
    });

    await this.prisma.activity.create({
      data: {
        userId: teacherId,
        type: 'QUIZ_CREATED',
        description: `Created quiz: ${quiz.title}`,
      },
    });

    return quiz;
  }

  async getTeacherQuizzes(teacherId: string, classId?: string) {
    const where: any = { class: { teacherId } };
    if (classId) where.classId = classId;

    return this.prisma.quiz.findMany({
      where,
      include: {
        class: { include: { subject: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentQuizzes(studentId: string, classId?: string) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId },
      select: { classId: true },
    });

    const classIds = classId
      ? [classId]
      : enrollments.map((e) => e.classId);

    const quizzes = await this.prisma.quiz.findMany({
      where: {
        classId: { in: classIds },
        status: { in: ['PUBLISHED', 'ACTIVE', 'COMPLETED'] },
      },
      include: {
        class: { include: { subject: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId },
          select: {
            id: true,
            status: true,
            score: true,
            totalMarks: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((q) => ({
      ...q,
      myAttempts: q.attempts,
      hasAttempted: q.attempts.length > 0,
      bestScore: q.attempts.reduce((max, a) => Math.max(max, a.score || 0), 0),
    }));
  }

  async getQuizById(id: string, userId: string, role: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        class: { include: { subject: true, teacher: { select: { id: true, name: true } } } },
        questions: {
          include: {
            options: { orderBy: { order: 'asc' } },
            acceptedAnswers: true,
            matchPairs: true,
            testCases: role === 'TEACHER' ? true : { where: { isHidden: false } },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    // If student, hide correct answers
    if (role === 'STUDENT') {
      quiz.questions = quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o, isCorrect: undefined as any })),
        acceptedAnswers: [],
        correctNumber: undefined as any,
        idealAnswer: undefined as any,
      }));
    }

    return quiz;
  }

  async update(id: string, teacherId: string, data: Partial<{
    title: string;
    description: string;
    mode: QuizMode;
    status: QuizStatus;
    startTime: Date;
    endTime: Date;
    duration: number;
    passingMarks: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showResults: boolean;
    showAnswers: boolean;
    maxAttempts: number;
    hasNegativeMarking: boolean;
    negativeMarksValue: number;
  }>) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    return this.prisma.quiz.update({
      where: { id },
      data,
      include: { class: { include: { subject: true } } },
    });
  }

  async publish(id: string, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { class: true, _count: { select: { questions: true } } },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');
    if (quiz._count.questions === 0) throw new BadRequestException('Add at least one question before publishing');

    // Calculate total marks
    const totalMarks = await this.prisma.question.aggregate({
      where: { quizId: id },
      _sum: { marks: true },
    });

    return this.prisma.quiz.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        totalMarks: totalMarks._sum.marks || 0,
      },
    });
  }

  async delete(id: string, teacherId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    await this.prisma.quiz.delete({ where: { id } });
    return { message: 'Quiz deleted successfully' };
  }
}
