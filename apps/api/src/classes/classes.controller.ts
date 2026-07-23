// ===========================
// Classes Controller
// ===========================

import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@quizai/database';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class CreateDepartmentDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
}

class CreateSubjectDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() departmentId: string;
  @IsOptional() semester?: number;
}

class CreateClassDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() subjectId?: string;
  @IsOptional() @IsString() subjectName?: string;
  @IsString() @IsNotEmpty() academicYear: string;
  @IsOptional() @IsString() section?: string;
}

class JoinClassDto {
  @IsString() @IsNotEmpty() joinCode: string;
}

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  // ===== DEPARTMENTS =====

  @Post('departments')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create department' })
  async createDepartment(@Body() dto: CreateDepartmentDto) {
    const dept = await this.classesService.createDepartment(dto);
    return { success: true, data: dept };
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all departments' })
  async getDepartments() {
    const depts = await this.classesService.getDepartments();
    return { success: true, data: depts };
  }

  @Delete('departments/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete department' })
  async deleteDepartment(@Param('id') id: string) {
    const result = await this.classesService.deleteDepartment(id);
    return { success: true, data: result };
  }

  // ===== SUBJECTS =====

  @Post('subjects')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create subject' })
  async createSubject(@Body() dto: CreateSubjectDto) {
    const subject = await this.classesService.createSubject(dto);
    return { success: true, data: subject };
  }

  @Get('subjects')
  @ApiOperation({ summary: 'List subjects' })
  async getSubjects(@Query('departmentId') departmentId?: string) {
    const subjects = await this.classesService.getSubjects(departmentId);
    return { success: true, data: subjects };
  }

  @Delete('subjects/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete subject' })
  async deleteSubject(@Param('id') id: string) {
    const result = await this.classesService.deleteSubject(id);
    return { success: true, data: result };
  }

  // ===== CLASSES =====

  @Post('classes')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Create a class (Teacher)' })
  async createClass(@Body() dto: CreateClassDto, @Request() req: any) {
    const classItem = await this.classesService.createClass(req.user.userId, dto);
    return { success: true, data: classItem };
  }

  @Get('classes')
  @ApiOperation({ summary: 'Get classes for current user' })
  async getClasses(@Request() req: any) {
    if (req.user.role === 'TEACHER') {
      const classes = await this.classesService.getTeacherClasses(req.user.userId);
      return { success: true, data: classes };
    } else if (req.user.role === 'STUDENT') {
      const classes = await this.classesService.getStudentClasses(req.user.userId);
      return { success: true, data: classes };
    } else {
      const classes = await this.classesService.getAllClasses();
      return { success: true, data: classes };
    }
  }

  @Get('classes/:id')
  @ApiOperation({ summary: 'Get class details' })
  async getClassById(@Param('id') id: string, @Request() req: any) {
    const classItem = await this.classesService.getClassById(id, req.user.role);
    return { success: true, data: classItem };
  }

  @Post('classes/join')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Join a class using code (Student)' })
  async joinClass(@Body() dto: JoinClassDto, @Request() req: any) {
    const result = await this.classesService.joinClass(req.user.userId, dto.joinCode);
    return { success: true, data: result };
  }

  @Delete('classes/:classId/leave')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Leave a class (Student)' })
  async leaveClass(@Param('classId') classId: string, @Request() req: any) {
    const result = await this.classesService.leaveClass(req.user.userId, classId);
    return { success: true, data: result };
  }

  @Delete('classes/:id')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Delete a class (Teacher)' })
  async deleteClass(@Param('id') id: string, @Request() req: any) {
    const result = await this.classesService.deleteClass(id, req.user.userId);
    return { success: true, data: result };
  }

  @Delete('classes/:classId/students/:studentId')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Remove student from class (Teacher)' })
  async removeStudent(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Request() req: any,
  ) {
    const result = await this.classesService.removeStudent(classId, studentId, req.user.userId);
    return { success: true, data: result };
  }
}
