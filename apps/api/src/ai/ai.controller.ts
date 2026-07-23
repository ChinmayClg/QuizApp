// ===========================
// AI Controller
// ===========================

import { Controller, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Role } from '@quizai/database';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class GradeDescriptiveDto {
  @IsString() @IsNotEmpty() question: string;
  @IsOptional() @IsString() idealAnswer?: string;
  @IsString() @IsNotEmpty() studentAnswer: string;
  @IsNumber() maxMarks: number;
}

class GenerateQuestionsDto {
  @IsString() @IsNotEmpty() topic: string;
  @IsString() @IsNotEmpty() subject: string;
  @IsString() @IsNotEmpty() difficulty: string;
  @IsNumber() count: number;
  @IsArray() @IsString({ each: true }) types: string[];
}

class ExplainWrongDto {
  @IsString() @IsNotEmpty() question: string;
  @IsString() @IsNotEmpty() correctAnswer: string;
  @IsString() @IsNotEmpty() studentAnswer: string;
}

class ParseDocumentDto {
  @IsBoolean() @IsOptional() extractStrictly?: boolean;
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('grade-descriptive')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Grade a descriptive answer using AI' })
  async gradeDescriptive(@Body() dto: GradeDescriptiveDto) {
    const result = await this.aiService.gradeDescriptiveAnswer(dto);
    return { success: true, data: result };
  }

  @Post('generate-questions')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Generate questions using AI' })
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    const questions = await this.aiService.generateQuestions(dto);
    return { success: true, data: questions };
  }

  @Post('explain-wrong')
  @ApiOperation({ summary: 'Explain why an answer is wrong' })
  async explainWrong(@Body() dto: ExplainWrongDto) {
    const explanation = await this.aiService.explainWrongAnswer(dto);
    return { success: true, data: { explanation } };
  }

  @Post('parse-document')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Parse a PDF/Word doc and generate questions' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async parseDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: any
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const extractStrictly = dto.extractStrictly === 'true' || dto.extractStrictly === true;
    
    try {
      // 1. Extract raw text from document buffer
      const text = await this.aiService.extractTextFromFile(file);
      
      // 2. Generate questions from extracted text
      const questions = await this.aiService.generateQuestionsFromText(text, extractStrictly);
      
      return { success: true, data: questions };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to process document');
    }
  }
}
