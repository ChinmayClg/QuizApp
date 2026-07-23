// ===========================
// Analytics Controller
// ===========================

import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@quizai/database';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('quiz/:quizId')
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Get quiz analytics' })
  async getQuizAnalytics(@Param('quizId') quizId: string) {
    const analytics = await this.analyticsService.getQuizAnalytics(quizId);
    return { success: true, data: analytics };
  }

  @Get('teacher/dashboard')
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: 'Get teacher dashboard data' })
  async getTeacherDashboard(@Request() req: any) {
    const data = await this.analyticsService.getTeacherDashboard(req.user.userId);
    return { success: true, data };
  }

  @Get('student/dashboard')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student dashboard data' })
  async getStudentDashboard(@Request() req: any) {
    const data = await this.analyticsService.getStudentDashboard(req.user.userId);
    return { success: true, data };
  }

  @Get('student/history')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get student quiz history' })
  async getStudentHistory(@Request() req: any) {
    const data = await this.analyticsService.getStudentHistory(req.user.userId);
    return { success: true, data };
  }

  @Get('admin/dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard data' })
  async getAdminDashboard() {
    const data = await this.analyticsService.getAdminDashboard();
    return { success: true, data };
  }
}
