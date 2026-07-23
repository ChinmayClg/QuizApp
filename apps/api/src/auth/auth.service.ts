// ===========================
// Auth Service - Registration, Login, Token Management
// ===========================

import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@quizai/database';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID') || 'YOUR_GOOGLE_CLIENT_ID'
    );
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: Role;
    department?: string;
    enrollmentNumber?: string;
    employeeId?: string;
  }) {
    // Check college email domain
    const allowedDomain = this.configService.get<string>('COLLEGE_EMAIL_DOMAIN');
    if (allowedDomain && !data.email.endsWith(`@${allowedDomain}`)) {
      throw new BadRequestException(
        `Please use your college email (@${allowedDomain})`,
      );
    }

    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        department: data.department,
        enrollmentNumber: data.enrollmentNumber,
        employeeId: data.employeeId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        userId: user.id,
        type: 'USER_REGISTERED',
        description: `${user.name} registered as ${user.role}`,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.role);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID') || 'YOUR_GOOGLE_CLIENT_ID',
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token');
      }

      const { email, sub: googleId, name, picture } = payload;

      // Check if user exists by email or googleId
      let user = await this.prisma.user.findFirst({
        where: { OR: [{ googleId }, { email }] }
      });

      if (!user) {
        // Create new user, default to STUDENT for Google OAuth registrations
        // They will need to fill in their seat number (enrollmentNumber) later
        user = await this.prisma.user.create({
          data: {
            email,
            name: name || 'Student',
            role: Role.STUDENT,
            googleId,
            profileImage: picture,
          }
        });
      } else if (!user.googleId) {
        // Link googleId to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId, profileImage: user.profileImage || picture }
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const tokens = await this.generateTokens(user.id, user.role);

      const { passwordHash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        enrollmentNumber: true,
        employeeId: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user.id, user.role);
  }

  private async generateTokens(userId: string, role: Role) {
    const payload = { sub: userId, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<any>('JWT_EXPIRES_IN', '7d'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'quizai-refresh-secret'),
        expiresIn: this.configService.get<any>('JWT_REFRESH_EXPIRES_IN', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
