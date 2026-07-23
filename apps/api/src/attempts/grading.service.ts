// ===========================
// Grading Service - Auto-Grade Engine for All Question Types
// ===========================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Grade a single student answer based on question type.
   * Returns { score, isCorrect, reasoning }
   */
  async gradeAnswer(questionId: string, studentAnswer: string): Promise<{
    score: number;
    isCorrect: boolean;
    reasoning: string;
  }> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
        acceptedAnswers: true,
        matchPairs: true,
      },
    });

    if (!question) {
      return { score: 0, isCorrect: false, reasoning: 'Question not found' };
    }

    switch (question.type) {
      case 'MCQ':
        return this.gradeMCQ(question, studentAnswer);
      case 'TRUE_FALSE':
        return this.gradeTrueFalse(question, studentAnswer);
      case 'FILL_BLANK':
        return this.gradeFillBlank(question, studentAnswer);
      case 'MATCH':
        return this.gradeMatch(question, studentAnswer);
      case 'NUMERICAL':
        return this.gradeNumerical(question, studentAnswer);
      case 'DESCRIPTIVE':
        // Descriptive answers need AI or manual grading - return 0 pending
        return { score: 0, isCorrect: false, reasoning: 'Pending AI/manual grading' };
      case 'CODING':
        // Coding needs a judge - return 0 pending
        return { score: 0, isCorrect: false, reasoning: 'Pending code evaluation' };
      default:
        return { score: 0, isCorrect: false, reasoning: 'Unknown question type' };
    }
  }

  private gradeMCQ(question: any, answer: string): { score: number; isCorrect: boolean; reasoning: string } {
    // answer is the option ID
    const selectedOption = question.options.find((o: any) => o.id === answer);
    if (!selectedOption) {
      return { score: 0, isCorrect: false, reasoning: 'Invalid option selected' };
    }

    const correctOption = question.options.find((o: any) => o.isCorrect);
    const isCorrect = selectedOption.isCorrect;

    return {
      score: isCorrect ? question.marks : 0,
      isCorrect,
      reasoning: isCorrect
        ? 'Correct answer!'
        : `Incorrect. The correct answer is: ${correctOption?.text || 'N/A'}`,
    };
  }

  private gradeTrueFalse(question: any, answer: string): { score: number; isCorrect: boolean; reasoning: string } {
    const correctOption = question.options.find((o: any) => o.isCorrect);
    if (!correctOption) {
      return { score: 0, isCorrect: false, reasoning: 'No correct answer set' };
    }

    const isCorrect = answer.toLowerCase() === correctOption.text.toLowerCase();

    return {
      score: isCorrect ? question.marks : 0,
      isCorrect,
      reasoning: isCorrect
        ? 'Correct!'
        : `Incorrect. The answer is: ${correctOption.text}`,
    };
  }

  private gradeFillBlank(question: any, answer: string): { score: number; isCorrect: boolean; reasoning: string } {
    const normalizedAnswer = answer.trim().toLowerCase();
    const acceptedAnswers = question.acceptedAnswers.map((a: any) => a.answer.trim().toLowerCase());

    const isCorrect = acceptedAnswers.includes(normalizedAnswer);

    return {
      score: isCorrect ? question.marks : 0,
      isCorrect,
      reasoning: isCorrect
        ? 'Correct!'
        : `Incorrect. Accepted answers include: ${question.acceptedAnswers.map((a: any) => a.answer).join(', ')}`,
    };
  }

  private gradeMatch(question: any, answer: string): { score: number; isCorrect: boolean; reasoning: string } {
    try {
      const studentPairs: { leftItem: string; rightItem: string }[] = JSON.parse(answer);
      const correctPairs = question.matchPairs;
      let correctCount = 0;

      for (const sp of studentPairs) {
        const match = correctPairs.find(
          (cp: any) =>
            cp.leftItem.trim().toLowerCase() === sp.leftItem.trim().toLowerCase() &&
            cp.rightItem.trim().toLowerCase() === sp.rightItem.trim().toLowerCase(),
        );
        if (match) correctCount++;
      }

      const totalPairs = correctPairs.length;
      const ratio = totalPairs > 0 ? correctCount / totalPairs : 0;
      const score = Math.round(question.marks * ratio * 100) / 100;
      const isCorrect = correctCount === totalPairs;

      return {
        score,
        isCorrect,
        reasoning: isCorrect
          ? 'All pairs matched correctly!'
          : `${correctCount}/${totalPairs} pairs correct.`,
      };
    } catch {
      return { score: 0, isCorrect: false, reasoning: 'Invalid answer format for matching question' };
    }
  }

  private gradeNumerical(question: any, answer: string): { score: number; isCorrect: boolean; reasoning: string } {
    const studentNum = parseFloat(answer);
    if (isNaN(studentNum)) {
      return { score: 0, isCorrect: false, reasoning: 'Invalid number' };
    }

    const correctNum = question.correctNumber;
    const tolerance = question.tolerance || 0;

    const isCorrect = Math.abs(studentNum - correctNum) <= tolerance;

    return {
      score: isCorrect ? question.marks : 0,
      isCorrect,
      reasoning: isCorrect
        ? 'Correct!'
        : `Incorrect. The correct answer is ${correctNum}${tolerance > 0 ? ` (±${tolerance})` : ''}. You answered ${studentNum}.`,
    };
  }

  /**
   * Grade an entire quiz attempt
   */
  async gradeAttempt(attemptId: string): Promise<{ totalScore: number; totalMarks: number }> {
    const attempt = await this.prisma.studentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        quiz: { include: { questions: true } },
      },
    });

    if (!attempt) return { totalScore: 0, totalMarks: 0 };

    let totalScore = 0;

    for (const answer of attempt.answers) {
      const result = await this.gradeAnswer(answer.questionId, answer.answer);

      await this.prisma.studentAnswer.update({
        where: { id: answer.id },
        data: {
          isCorrect: result.isCorrect,
          aiScore: result.score,
          finalScore: result.score,
          aiReasoning: result.reasoning,
          gradedAt: new Date(),
        },
      });

      totalScore += result.score;
    }

    // Update attempt
    await this.prisma.studentAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        status: 'GRADED',
      },
    });

    return { totalScore, totalMarks: attempt.totalMarks };
  }
}
