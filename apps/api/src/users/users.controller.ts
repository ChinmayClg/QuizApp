// ===========================
// Users Controller
// ===========================

import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@quizai/database';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

class UserQueryDto {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}

class CreateUserDto {
  @IsString() name: string;
  @IsString() email: string;
  @IsEnum(Role) role: Role;
  @IsOptional() @IsString() password?: string;
  @IsOptional() @IsString() enrollmentNumber?: string;
  @IsOptional() @IsString() employeeId?: string;
}

class UpdateUserDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() profileImage?: string;
  @IsOptional() @IsString() enrollmentNumber?: string;
  @IsOptional() @IsString() employeeId?: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(query);
    return { success: true, data: result.users, pagination: result.pagination };
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats() {
    const stats = await this.usersService.getStats();
    return { success: true, data: stats };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { success: true, data: user };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Register a single user (Admin only)' })
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.usersService.createUser(dto);
    return { success: true, data: user };
  }

  @Post('bulk')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Bulk register users (Admin only)' })
  async createBulkUsers(@Body() dto: { users: CreateUserDto[] }) {
    if (!dto.users || !Array.isArray(dto.users)) {
      return { success: false, error: 'Invalid payload. Expected { users: [...] }' };
    }
    const result = await this.usersService.createBulkUsers(dto.users);
    return { success: true, data: result };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    // Users can update themselves, admins can update anyone
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
      return { success: false, error: 'Forbidden' };
    }
    const user = await this.usersService.update(id, dto);
    return { success: true, data: user };
  }

  @Put(':id/toggle-active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Toggle user active status (Admin only)' })
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    const result = await this.usersService.toggleActive(id, req.user.userId);
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const result = await this.usersService.delete(id, req.user.userId);
    return { success: true, data: result };
  }
}
