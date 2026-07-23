// ===========================
// Quizzes Controller
// ===========================

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, QuizMode } from '@quizai/database';
import { QuizzesService } from './quizzes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class CreateQuizDto {
  @IsString() @IsNotEmpty() classId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(QuizMode) mode: QuizMode;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @Type(() => Number) @IsInt() duration?: number;
  @IsOptional() @Type(() => Number) @IsInt() passingMarks?: number;
  @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @IsOptional() @IsBoolean() shuffleOptions?: boolean;
  @IsOptional() @IsBoolean() showResults?: boolean;
  @IsOptional() @IsBoolean() showAnswers?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() maxAttempts?: number;
}

class UpdateQuizDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(QuizMode) mode?: QuizMode;
  @IsOptional() @IsDateString() startTime?: string;
  @IsOptional() @IsDateString() endTime?: string;
  @IsOptional() @Type(() => Number) @IsInt() duration?: number;
  @IsOptional() @Type(() => Number) @IsInt() passingMarks?: number;
  @IsOptional() @IsBoolean() shuffleQuestions?: boolean;
  @IsOptional() @IsBoolean() shuffleOptions?: boolean;
  @IsOptional() @IsBoolean() showResults?: boolean;
  @IsOptional() @IsBoolean() showAnswers?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() maxAttempts?: number;
}

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private quizzesService: QuizzesService) {}

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Create a quiz' })
  async create(@Body() dto: CreateQuizDto, @Request() req: any) {
    const quiz = await this.quizzesService.create(req.user.userId, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return { success: true, data: quiz };
  }

  @Get()
  @ApiOperation({ summary: 'Get quizzes for current user' })
  async getQuizzes(@Query('classId') classId: string, @Request() req: any) {
    if (req.user.role === 'TEACHER') {
      const quizzes = await this.quizzesService.getTeacherQuizzes(req.user.userId, classId);
      return { success: true, data: quizzes };
    } else {
      const quizzes = await this.quizzesService.getStudentQuizzes(req.user.userId, classId);
      return { success: true, data: quizzes };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz details' })
  async getById(@Param('id') id: string, @Request() req: any) {
    const quiz = await this.quizzesService.getQuizById(id, req.user.userId, req.user.role);
    return { success: true, data: quiz };
  }

  @Put(':id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Update quiz' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuizDto, @Request() req: any) {
    const quiz = await this.quizzesService.update(id, req.user.userId, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return { success: true, data: quiz };
  }

  @Put(':id/publish')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Publish quiz' })
  async publish(@Param('id') id: string, @Request() req: any) {
    const quiz = await this.quizzesService.publish(id, req.user.userId);
    return { success: true, data: quiz };
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Delete quiz' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const result = await this.quizzesService.delete(id, req.user.userId);
    return { success: true, data: result };
  }
}
