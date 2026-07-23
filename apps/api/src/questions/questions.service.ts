// ===========================
// Questions Service - All 7 Question Types
// ===========================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionType, DifficultyLevel, BloomLevel, DescriptiveGradingMode } from '@quizai/database';

interface CreateQuestionData {
  quizId: string;
  type: QuestionType;
  questionText: string;
  marks: number;
  difficulty?: DifficultyLevel;
  bloomLevel?: BloomLevel;
  explanation?: string;
  imageUrl?: string;
  order?: number;
  // MCQ / TRUE_FALSE
  options?: { text: string; isCorrect: boolean; order?: number }[];
  // FILL_BLANK
  acceptedAnswers?: string[];
  // MATCH
  matchPairs?: { leftItem: string; rightItem: string }[];
  // NUMERICAL
  correctNumber?: number;
  tolerance?: number;
  // DESCRIPTIVE
  idealAnswer?: string;
  gradingMode?: DescriptiveGradingMode;
  // CODING
  starterCode?: string;
  language?: string;
  testCases?: { input: string; expectedOutput: string; isHidden: boolean }[];
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, data: CreateQuestionData) {
    // Verify teacher owns the quiz
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: data.quizId },
      include: { class: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    // Get next order
    const lastQuestion = await this.prisma.question.findFirst({
      where: { quizId: data.quizId },
      orderBy: { order: 'desc' },
    });
    const order = data.order ?? (lastQuestion ? lastQuestion.order + 1 : 0);

    // Create question with type-specific related data
    const question = await this.prisma.question.create({
      data: {
        quizId: data.quizId,
        type: data.type,
        questionText: data.questionText,
        marks: data.marks,
        difficulty: data.difficulty,
        bloomLevel: data.bloomLevel,
        explanation: data.explanation,
        imageUrl: data.imageUrl,
        order,
        correctNumber: data.correctNumber,
        tolerance: data.tolerance,
        idealAnswer: data.idealAnswer,
        gradingMode: data.gradingMode,
        starterCode: data.starterCode,
        language: data.language,
        // Create related records
        options: data.options
          ? { create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order ?? i })) }
          : undefined,
        acceptedAnswers: data.acceptedAnswers
          ? { create: data.acceptedAnswers.map((a) => ({ answer: a })) }
          : undefined,
        matchPairs: data.matchPairs
          ? { create: data.matchPairs }
          : undefined,
        testCases: data.testCases
          ? { create: data.testCases }
          : undefined,
      },
      include: {
        options: { orderBy: { order: 'asc' } },
        acceptedAnswers: true,
        matchPairs: true,
        testCases: true,
      },
    });

    // Update quiz total marks
    await this.updateQuizTotalMarks(data.quizId);

    return question;
  }

  async update(id: string, teacherId: string, data: Partial<CreateQuestionData>) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { quiz: { include: { class: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your question');

    // Update basic fields
    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        questionText: data.questionText,
        marks: data.marks,
        difficulty: data.difficulty,
        bloomLevel: data.bloomLevel,
        explanation: data.explanation,
        imageUrl: data.imageUrl,
        order: data.order,
        correctNumber: data.correctNumber,
        tolerance: data.tolerance,
        idealAnswer: data.idealAnswer,
        gradingMode: data.gradingMode,
        starterCode: data.starterCode,
        language: data.language,
      },
    });

    // Update related records if provided
    if (data.options) {
      await this.prisma.option.deleteMany({ where: { questionId: id } });
      await this.prisma.option.createMany({
        data: data.options.map((o, i) => ({
          questionId: id,
          text: o.text,
          isCorrect: o.isCorrect,
          order: o.order ?? i,
        })),
      });
    }

    if (data.acceptedAnswers) {
      await this.prisma.acceptedAnswer.deleteMany({ where: { questionId: id } });
      await this.prisma.acceptedAnswer.createMany({
        data: data.acceptedAnswers.map((a) => ({ questionId: id, answer: a })),
      });
    }

    if (data.matchPairs) {
      await this.prisma.matchPair.deleteMany({ where: { questionId: id } });
      await this.prisma.matchPair.createMany({
        data: data.matchPairs.map((m) => ({ questionId: id, leftItem: m.leftItem, rightItem: m.rightItem })),
      });
    }

    if (data.testCases) {
      await this.prisma.testCase.deleteMany({ where: { questionId: id } });
      await this.prisma.testCase.createMany({
        data: data.testCases.map((t) => ({
          questionId: id,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: t.isHidden,
        })),
      });
    }

    if (data.marks) {
      await this.updateQuizTotalMarks(question.quizId);
    }

    return this.prisma.question.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: 'asc' } },
        acceptedAnswers: true,
        matchPairs: true,
        testCases: true,
      },
    });
  }

  async delete(id: string, teacherId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { quiz: { include: { class: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your question');

    await this.prisma.question.delete({ where: { id } });
    await this.updateQuizTotalMarks(question.quizId);

    return { message: 'Question deleted' };
  }

  async reorder(quizId: string, teacherId: string, questionOrder: { id: string; order: number }[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { class: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    await Promise.all(
      questionOrder.map((q) =>
        this.prisma.question.update({ where: { id: q.id }, data: { order: q.order } }),
      ),
    );

    return { message: 'Questions reordered' };
  }

  // ===== QUESTION BANK =====

  async addToBank(teacherId: string, data: {
    subject: string;
    topic: string;
    type: QuestionType;
    questionText: string;
    questionData: any;
    tags?: string[];
    difficulty?: DifficultyLevel;
    bloomLevel?: BloomLevel;
  }): Promise<any> {
    return this.prisma.questionBankItem.create({
      data: {
        teacherId,
        subject: data.subject,
        topic: data.topic,
        type: data.type,
        questionText: data.questionText,
        questionData: data.questionData,
        tags: data.tags || [],
        difficulty: data.difficulty,
        bloomLevel: data.bloomLevel,
      },
    });
  }

  async getBank(teacherId: string, filters: { subject?: string; topic?: string; type?: QuestionType; search?: string }): Promise<any> {
    const where: any = { teacherId };
    if (filters.subject) where.subject = filters.subject;
    if (filters.topic) where.topic = filters.topic;
    if (filters.type) where.type = filters.type;
    if (filters.search) {
      where.questionText = { contains: filters.search, mode: 'insensitive' };
    }

    return this.prisma.questionBankItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async importFromBank(teacherId: string, quizId: string, questionBankIds: string[]) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { class: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.class.teacherId !== teacherId) throw new ForbiddenException('Not your quiz');

    const bankItems = await this.prisma.questionBankItem.findMany({
      where: { id: { in: questionBankIds }, teacherId },
    });

    const lastQuestion = await this.prisma.question.findFirst({
      where: { quizId },
      orderBy: { order: 'desc' },
    });
    let order = lastQuestion ? lastQuestion.order + 1 : 0;

    const created: any[] = [];
    for (const item of bankItems) {
      const qData = item.questionData as any;
      const question = await this.create(teacherId, {
        quizId,
        type: item.type,
        questionText: item.questionText,
        marks: qData.marks || 1,
        difficulty: item.difficulty || undefined,
        bloomLevel: item.bloomLevel || undefined,
        order: order++,
        options: qData.options,
        acceptedAnswers: qData.acceptedAnswers,
        matchPairs: qData.matchPairs,
        correctNumber: qData.correctNumber,
        tolerance: qData.tolerance,
        idealAnswer: qData.idealAnswer,
        gradingMode: qData.gradingMode,
        testCases: qData.testCases,
        starterCode: qData.starterCode,
        language: qData.language,
      });
      created.push(question);

      // Increment usage count
      await this.prisma.questionBankItem.update({
        where: { id: item.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return created;
  }

  private async updateQuizTotalMarks(quizId: string) {
    const result = await this.prisma.question.aggregate({
      where: { quizId },
      _sum: { marks: true },
    });
    await this.prisma.quiz.update({
      where: { id: quizId },
      data: { totalMarks: result._sum.marks || 0 },
    });
  }
}
