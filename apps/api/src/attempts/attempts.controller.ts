// ===========================
// Attempts Controller
// ===========================

import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@quizai/database';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class SubmitAnswerDto {
  @IsString() questionId: string;
  @IsString() answer: string;
}

class SubmitQuizDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => SubmitAnswerDto)
  answers: SubmitAnswerDto[];
}

class SaveAnswerDto {
  @IsString() questionId: string;
  @IsString() answer: string;
}

class OverrideScoreDto {
  @IsNumber() score: number;
  @IsOptional() @IsString() feedback?: string;
}

@ApiTags('Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private attemptsService: AttemptsService) {}

  @Get('active')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get active in-progress attempts' })
  async getActiveAttempts(@Request() req: any) {
    const attempts = await this.attemptsService.getActiveAttempts(req.user.userId);
    return { success: true, data: attempts };
  }

  @Post('start/:quizId')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(@Param('quizId') quizId: string, @Request() req: any) {
    const attempt = await this.attemptsService.startAttempt(req.user.userId, quizId);
    return { success: true, data: attempt };
  }

  @Post(':attemptId/submit')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Submit quiz answers' })
  async submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitQuizDto,
    @Request() req: any,
  ) {
    const result = await this.attemptsService.submitAttempt(req.user.userId, attemptId, dto.answers);
    return { success: true, data: result };
  }

  @Post(':attemptId/save-answer')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Save a single answer (auto-save)' })
  async saveAnswer(
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveAnswerDto,
    @Request() req: any,
  ) {
    const result = await this.attemptsService.saveAnswer(
      req.user.userId, attemptId, dto.questionId, dto.answer,
    );
    return { success: true, data: result };
  }

  @Get(':attemptId/result')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get attempt result' })
  async getResult(@Param('attemptId') attemptId: string, @Request() req: any) {
    const result = await this.attemptsService.getAttemptResult(req.user.userId, attemptId);
    return { success: true, data: result };
  }

  @Get(':attemptId/review')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get attempt for teacher review' })
  async getReview(@Param('attemptId') attemptId: string, @Request() req: any) {
    const result = await this.attemptsService.getAttemptForTeacher(req.user.userId, attemptId);
    return { success: true, data: result };
  }

  @Get('submissions/:quizId')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get all submissions for a quiz' })
  async getSubmissions(@Param('quizId') quizId: string, @Request() req: any) {
    const submissions = await this.attemptsService.getQuizSubmissions(req.user.userId, quizId);
    return { success: true, data: submissions };
  }

  @Put('override/:answerId')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Override AI score for an answer' })
  async overrideScore(
    @Param('answerId') answerId: string,
    @Body() dto: OverrideScoreDto,
    @Request() req: any,
  ) {
    const result = await this.attemptsService.overrideScore(req.user.userId, answerId, dto.score, dto.feedback);
    return { success: true, data: result };
  }
}
