// ===========================
// Attempts Service - Quiz Attempt Lifecycle
// ===========================

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradingService } from './grading.service';

@Injectable()
export class AttemptsService {
  constructor(
    private prisma: PrismaService,
    private gradingService: GradingService,
  ) {}

  async getActiveAttempts(studentId: string) {
    return this.prisma.studentAttempt.findMany({
      where: {
        studentId,
        status: 'IN_PROGRESS',
      },
      include: {
        quiz: {
          select: { title: true, class: { select: { name: true } } }
        }
      },
      orderBy: { startedAt: 'desc' }
    });
  }

  async startAttempt(studentId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { class: { include: { enrollments: true } } },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (!['PUBLISHED', 'ACTIVE'].includes(quiz.status)) {
      throw new BadRequestException('Quiz is not available');
    }

    // Verify student is enrolled
    const isEnrolled = quiz.class.enrollments.some((e) => e.studentId === studentId);
    if (!isEnrolled) throw new ForbiddenException('Not enrolled in this class');

    // Check time window
    const now = new Date();
    if (quiz.startTime && now < quiz.startTime) throw new BadRequestException('Quiz has not started yet');
    if (quiz.endTime && now > quiz.endTime) throw new BadRequestException('Quiz deadline has passed');

    // Check for in-progress attempt
    const inProgress = await this.prisma.studentAttempt.findFirst({
      where: { studentId, quizId, status: 'IN_PROGRESS' },
      include: { answers: true }
    });
    if (inProgress) {
      return inProgress;
    }

    // Check attempt limit
    const existingAttempts = await this.prisma.studentAttempt.count({
      where: { studentId, quizId },
    });
    if (existingAttempts >= quiz.maxAttempts) {
      throw new BadRequestException(`Maximum attempts (${quiz.maxAttempts}) reached`);
    }

    return this.prisma.studentAttempt.create({
      data: {
        studentId,
        quizId,
        totalMarks: quiz.totalMarks,
        status: 'IN_PROGRESS',
      },
    });
  }

  async submitAttempt(studentId: string, attemptId: string, answers: { questionId: string; answer: string }[]) {
    const attempt = await this.prisma.studentAttempt.findUnique({
      where: { id: attemptId },
      include: { quiz: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== studentId) throw new ForbiddenException('Not your attempt');
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt already submitted');

    // Check if timed out
    if (attempt.quiz.duration) {
      const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000 / 60;
      if (elapsed > attempt.quiz.duration + 1) { // 1 minute grace period
        await this.prisma.studentAttempt.update({
          where: { id: attemptId },
          data: { status: 'TIMED_OUT', submittedAt: new Date() },
        });
        throw new BadRequestException('Time limit exceeded');
      }
    }

    // Save all answers
    for (const ans of answers) {
      await this.prisma.studentAnswer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId: ans.questionId },
        },
        create: {
          attemptId,
          questionId: ans.questionId,
          answer: ans.answer,
        },
        update: {
          answer: ans.answer,
        },
      });
    }

    // Update attempt status
    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    await this.prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        timeTaken,
      },
    });

    // Auto-grade
    const gradeResult = await this.gradingService.gradeAttempt(attemptId);

    // Log activity
    await this.prisma.activity.create({
      data: {
        userId: studentId,
        type: 'QUIZ_SUBMITTED',
        description: `Submitted quiz: ${attempt.quiz.title} - Score: ${gradeResult.totalScore}/${gradeResult.totalMarks}`,
      },
    });

    return {
      attemptId,
      score: gradeResult.totalScore,
      totalMarks: gradeResult.totalMarks,
      timeTaken,
    };
  }

  async saveAnswer(studentId: string, attemptId: string, questionId: string, answer: string) {
    const attempt = await this.prisma.studentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== studentId) throw new ForbiddenException('Not your attempt');
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt already submitted');

    return this.prisma.studentAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      create: { attemptId, questionId, answer },
      update: { answer },
    });
  }

  async getAttemptForTeacher(teacherId: string, attemptId: string) {
    const attempt = await this.prisma.studentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { select: { id: true, name: true, email: true, enrollmentNumber: true } },
        quiz: {
          include: {
            class: { include: { subject: true } },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
                acceptedAnswers: true,
                matchPairs: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your class quiz');

    return attempt;
  }

  async getAttemptResult(studentId: string, attemptId: string) {
    const attempt = await this.prisma.studentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            class: { include: { subject: true } },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
                acceptedAnswers: true,
                matchPairs: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.studentId !== studentId) throw new ForbiddenException('Not your attempt');

    // If quiz doesn't show results, only return basic info
    if (!attempt.quiz.showResults && attempt.status !== 'GRADED') {
      return {
        id: attempt.id,
        quizTitle: attempt.quiz.title,
        status: attempt.status,
        message: 'Results will be available after grading',
      };
    }

    return attempt;
  }

  async getQuizSubmissions(teacherId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { class: true },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    return this.prisma.studentAttempt.findMany({
      where: { quizId },
      include: {
        student: { select: { id: true, name: true, email: true, enrollmentNumber: true } },
        answers: {
          include: { question: { select: { id: true, questionText: true, type: true, marks: true } } },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async overrideScore(teacherId: string, answerId: string, score: number, feedback?: string) {
    const answer = await this.prisma.studentAnswer.findUnique({
      where: { id: answerId },
      include: {
        attempt: { include: { quiz: { include: { class: true } } } },
        question: true,
      },
    });

    if (!answer) throw new NotFoundException('Answer not found');
    if (answer.attempt.quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');
    if (score > answer.question.marks) throw new BadRequestException(`Score cannot exceed ${answer.question.marks}`);

    // Update the answer
    await this.prisma.studentAnswer.update({
      where: { id: answerId },
      data: {
        teacherScore: score,
        finalScore: score,
        teacherFeedback: feedback,
        gradedAt: new Date(),
      },
    });

    // Recalculate attempt total
    const allAnswers = await this.prisma.studentAnswer.findMany({
      where: { attemptId: answer.attemptId },
    });
    const newTotal = allAnswers.reduce((sum, a) => sum + a.finalScore, 0);

    await this.prisma.studentAttempt.update({
      where: { id: answer.attemptId },
      data: { score: newTotal },
    });

    return { message: 'Score updated', newTotal };
  }
}
