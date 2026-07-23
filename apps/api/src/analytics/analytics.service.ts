// ===========================
// Analytics Service - Dashboards & Reports
// ===========================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ========== QUIZ ANALYTICS ==========

  async getQuizAnalytics(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const attempts = await this.prisma.studentAttempt.findMany({
      where: { quizId, status: { in: ['SUBMITTED', 'GRADED'] } },
      include: {
        answers: { include: { question: true } },
        student: { select: { name: true } },
      },
    });

    if (attempts.length === 0) {
      return {
        quizId,
        quizTitle: quiz.title,
        totalStudents: 0,
        attemptCount: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        medianScore: 0,
        passPercentage: 0,
        averageTimeTaken: 0,
        questionAnalytics: [],
      };
    }

    const scores = attempts.map((a) => a.score || 0).sort((a, b) => a - b);
    const totalStudents = new Set(attempts.map((a) => a.studentId)).size;
    const passingMarks = quiz.passingMarks || quiz.totalMarks * 0.4;
    const passCount = scores.filter((s) => s >= passingMarks).length;

    // Question-wise analytics
    const questionMap = new Map<string, { correct: number; total: number; text: string; type: string; wrongAnswers: Map<string, number> }>();

    for (const attempt of attempts) {
      for (const answer of attempt.answers) {
        const key = answer.questionId;
        if (!questionMap.has(key)) {
          questionMap.set(key, {
            correct: 0,
            total: 0,
            text: answer.question.questionText,
            type: answer.question.type,
            wrongAnswers: new Map(),
          });
        }
        const qa = questionMap.get(key)!;
        qa.total++;
        if (answer.isCorrect) qa.correct++;
        else {
          const wrongCount = qa.wrongAnswers.get(answer.answer) || 0;
          qa.wrongAnswers.set(answer.answer, wrongCount + 1);
        }
      }
    }

    const questionAnalytics = Array.from(questionMap.entries()).map(([id, data]) => ({
      questionId: id,
      questionText: data.text.substring(0, 100),
      type: data.type,
      correctPercentage: Math.round((data.correct / data.total) * 100),
      averageScore: data.correct / data.total,
      totalAttempts: data.total,
      commonWrongAnswers: Array.from(data.wrongAnswers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([answer, count]) => ({ answer, count })),
    }));

    const timeTaken = attempts.map((a) => a.timeTaken || 0);

    return {
      quizId,
      quizTitle: quiz.title,
      totalStudents,
      attemptCount: attempts.length,
      averageScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      highestScore: scores[scores.length - 1],
      lowestScore: scores[0],
      medianScore: scores[Math.floor(scores.length / 2)],
      passPercentage: Math.round((passCount / totalStudents) * 100),
      averageTimeTaken: Math.round(timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length),
      questionAnalytics,
    };
  }

  // ========== TEACHER DASHBOARD ==========

  async getTeacherDashboard(teacherId: string) {
    const [classes, quizzes, uniqueStudents] = await Promise.all([
      this.prisma.class.findMany({
        where: { teacherId, isActive: true },
        include: { _count: { select: { enrollments: true, quizzes: true } } },
      }),
      this.prisma.quiz.findMany({
        where: { class: { teacherId } },
        include: {
          class: { include: { subject: true } },
          _count: { select: { attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.classEnrollment.findMany({
        where: { class: { teacherId } },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
    ]);

    const totalStudents = uniqueStudents.length;
    const activeQuizzes = quizzes.filter((q) => ['PUBLISHED', 'ACTIVE'].includes(q.status)).length;

    return {
      totalClasses: classes.length,
      totalStudents,
      totalQuizzes: quizzes.length,
      activeQuizzes,
      recentQuizzes: quizzes.slice(0, 5).map((q) => ({
        id: q.id,
        title: q.title,
        className: q.class.name,
        subjectName: q.class.subject.name,
        status: q.status,
        attemptCount: q._count.attempts,
        createdAt: q.createdAt,
      })),
    };
  }

  // ========== STUDENT DASHBOARD ==========

  async getStudentDashboard(studentId: string) {
    const [attempts, pendingQuizzesData] = await Promise.all([
      this.prisma.studentAttempt.findMany({
        where: { studentId, status: { in: ['SUBMITTED', 'GRADED'] } },
        include: {
          quiz: { include: { class: { include: { subject: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      this.prisma.quiz.findMany({
        where: {
          status: { in: ['PUBLISHED', 'ACTIVE'] },
          class: { enrollments: { some: { studentId } } },
          attempts: { none: { studentId } },
        },
        include: { class: { select: { name: true, subject: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const pendingQuizzes = pendingQuizzesData.map(q => ({
      id: q.id,
      title: q.title,
      className: q.class.name,
      subjectName: q.class.subject.name,
      marks: q.totalMarks,
      duration: q.duration
    }));

    if (attempts.length === 0) {
      return {
        overallAverage: 0,
        totalQuizzesTaken: 0,
        recentAttempts: [],
        weakTopics: [],
        strongTopics: [],
        pendingQuizzes,
        aiRecommendations: ['Start taking quizzes to get personalized recommendations!'],
      };
    }

    // Calculate overall average
    const percentages = attempts.map((a) => (a.score || 0) / a.totalMarks * 100);
    const overallAverage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);

    // Topic analysis
    const topicScores = new Map<string, { total: number; scored: number; count: number; subject: string }>();
    for (const attempt of attempts) {
      const key = attempt.quiz.class.subject.name;
      if (!topicScores.has(key)) {
        topicScores.set(key, { total: 0, scored: 0, count: 0, subject: key });
      }
      const ts = topicScores.get(key)!;
      ts.total += attempt.totalMarks;
      ts.scored += attempt.score || 0;
      ts.count++;
    }

    const topics = Array.from(topicScores.entries()).map(([topic, data]) => ({
      topic,
      subject: data.subject,
      averageScore: Math.round((data.scored / data.total) * 100),
      totalQuestions: data.count,
      correctAnswers: Math.round(data.scored),
    }));

    const sorted = [...topics].sort((a, b) => a.averageScore - b.averageScore);
    const weakTopics = sorted.slice(0, 3);
    const strongTopics = sorted.reverse().slice(0, 3);

    // Simple AI recommendations
    const recommendations: string[] = [];
    for (const weak of weakTopics) {
      if (weak.averageScore < 50) {
        recommendations.push(`You need more practice in ${weak.topic}. Try focusing on fundamentals.`);
      }
    }
    if (recommendations.length === 0) {
      recommendations.push('Great performance! Keep up the good work!');
    }

    return {
      overallAverage,
      totalQuizzesTaken: attempts.length,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        quizId: a.quizId,
        quizTitle: a.quiz.title,
        className: a.quiz.class.name,
        score: a.score || 0,
        totalMarks: a.totalMarks,
        percentage: Math.round(((a.score || 0) / a.totalMarks) * 100),
        submittedAt: a.submittedAt?.toISOString(),
      })),
      weakTopics,
      strongTopics,
      pendingQuizzes,
      aiRecommendations: recommendations,
    };
  }

  async getStudentHistory(studentId: string) {
    const attempts = await this.prisma.studentAttempt.findMany({
      where: { studentId, status: { in: ['SUBMITTED', 'GRADED'] } },
      include: {
        quiz: { include: { class: { include: { subject: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      className: a.quiz.class.name,
      subjectName: a.quiz.class.subject.name,
      score: a.score || 0,
      totalMarks: a.totalMarks,
      percentage: Math.round(((a.score || 0) / a.totalMarks) * 100),
      status: a.status,
      submittedAt: a.submittedAt?.toISOString(),
    }));
  }


  // ========== ADMIN DASHBOARD ==========

  async getAdminDashboard() {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalDepartments,
      totalSubjects,
      totalQuizzes,
      totalAttempts,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.department.count(),
      this.prisma.subject.count(),
      this.prisma.quiz.count(),
      this.prisma.studentAttempt.count(),
      this.prisma.activity.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Department analytics
    const departments = await this.prisma.department.findMany({
      include: {
        subjects: {
          include: {
            classes: {
              include: {
                _count: { select: { enrollments: true, quizzes: true } },
              },
            },
          },
        },
      },
    });

    const departmentAnalytics = departments.map((dept) => {
      const classCount = dept.subjects.reduce((sum, s) => sum + s.classes.length, 0);
      const studentCount = dept.subjects.reduce(
        (sum, s) => sum + s.classes.reduce((cs, c) => cs + c._count.enrollments, 0),
        0,
      );
      const quizCount = dept.subjects.reduce(
        (sum, s) => sum + s.classes.reduce((cs, c) => cs + c._count.quizzes, 0),
        0,
      );

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        teacherCount: classCount,
        studentCount,
        quizCount,
        averageScore: 0, // Would need aggregation
      };
    });

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalDepartments,
      totalSubjects,
      totalQuizzes,
      totalAttempts,
      overallAverageScore: 0,
      departmentAnalytics,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        userId: a.userId,
        userName: a.user.name,
        timestamp: a.createdAt.toISOString(),
      })),
    };
  }
}
