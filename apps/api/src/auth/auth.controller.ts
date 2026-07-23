// ===========================
// Auth Controller - API Endpoints
// ===========================

import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@quizai/database';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// ---------- DTOs ----------

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  enrollmentNumber?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

// ---------- Controller ----------

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return { success: true, data: result };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);
    return { success: true, data: result };
  }

  @Post('google')
  @ApiOperation({ summary: 'Login or register with Google OAuth' })
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const result = await this.authService.googleLogin(dto.idToken);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    const user = await this.authService.getProfile(req.user.userId);
    return { success: true, data: user };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Request() req: any) {
    const tokens = await this.authService.refreshToken(req.user.userId);
    return { success: true, data: tokens };
  }
}
