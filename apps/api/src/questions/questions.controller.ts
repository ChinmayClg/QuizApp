// ===========================
// Questions Controller
// ===========================

import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role, QuestionType, DifficultyLevel, BloomLevel, DescriptiveGradingMode } from '@quizai/database';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class OptionDto {
  @IsString() text: string;
  @IsBoolean() isCorrect: boolean;
  @IsOptional() @IsNumber() order?: number;
}

class MatchPairDto {
  @IsString() leftItem: string;
  @IsString() rightItem: string;
}

class TestCaseDto {
  @IsString() input: string;
  @IsString() expectedOutput: string;
  @IsBoolean() isHidden: boolean;
}

class CreateQuestionDto {
  @IsString() @IsNotEmpty() quizId: string;
  @IsEnum(QuestionType) type: QuestionType;
  @IsString() @IsNotEmpty() questionText: string;
  @IsNumber() marks: number;
  @IsOptional() @IsEnum(DifficultyLevel) difficulty?: DifficultyLevel;
  @IsOptional() @IsEnum(BloomLevel) bloomLevel?: BloomLevel;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionDto) options?: OptionDto[];
  @IsOptional() @IsArray() @IsString({ each: true }) acceptedAnswers?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => MatchPairDto) matchPairs?: MatchPairDto[];
  @IsOptional() @IsNumber() correctNumber?: number;
  @IsOptional() @IsNumber() tolerance?: number;
  @IsOptional() @IsString() idealAnswer?: string;
  @IsOptional() @IsEnum(DescriptiveGradingMode) gradingMode?: DescriptiveGradingMode;
  @IsOptional() @IsString() starterCode?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TestCaseDto) testCases?: TestCaseDto[];
}

class ReorderDto {
  @IsArray() questionOrder: { id: string; order: number }[];
}

class AddToBankDto {
  @IsString() subject: string;
  @IsString() topic: string;
  @IsEnum(QuestionType) type: QuestionType;
  @IsString() questionText: string;
  @IsOptional() questionData: any;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsEnum(DifficultyLevel) difficulty?: DifficultyLevel;
  @IsOptional() @IsEnum(BloomLevel) bloomLevel?: BloomLevel;
}

class ImportFromBankDto {
  @IsString() quizId: string;
  @IsArray() @IsString({ each: true }) questionBankIds: string[];
}

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private questionsService: QuestionsService) {}

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Create a question' })
  async create(@Body() dto: CreateQuestionDto, @Request() req: any) {
    const question = await this.questionsService.create(req.user.userId, dto);
    return { success: true, data: question };
  }

  @Put(':id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Update a question' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateQuestionDto>, @Request() req: any) {
    const question = await this.questionsService.update(id, req.user.userId, dto);
    return { success: true, data: question };
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Delete a question' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const result = await this.questionsService.delete(id, req.user.userId);
    return { success: true, data: result };
  }

  @Put('reorder/:quizId')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Reorder questions in a quiz' })
  async reorder(@Param('quizId') quizId: string, @Body() dto: ReorderDto, @Request() req: any) {
    const result = await this.questionsService.reorder(quizId, req.user.userId, dto.questionOrder);
    return { success: true, data: result };
  }

  // ===== QUESTION BANK =====

  @Post('bank')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Add question to bank' })
  async addToBank(@Body() dto: AddToBankDto, @Request() req: any): Promise<any> {
    const item = await this.questionsService.addToBank(req.user.userId, dto);
    return { success: true, data: item };
  }

  @Get('bank')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get question bank' })
  async getBank(
    @Query('subject') subject: string,
    @Query('topic') topic: string,
    @Query('type') type: QuestionType,
    @Query('search') search: string,
    @Request() req: any,
  ): Promise<any> {
    const items = await this.questionsService.getBank(req.user.userId, { subject, topic, type, search });
    return { success: true, data: items };
  }

  @Post('bank/import')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Import questions from bank to quiz' })
  async importFromBank(@Body() dto: ImportFromBankDto, @Request() req: any) {
    const questions = await this.questionsService.importFromBank(req.user.userId, dto.quizId, dto.questionBankIds);
    return { success: true, data: questions };
  }
}
