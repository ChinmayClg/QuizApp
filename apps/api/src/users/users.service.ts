// ===========================
// Users Service - CRUD & Management
// ===========================

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@quizai/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    role?: Role;
    search?: string;
    page?: number;
    limit?: number;
    department?: string;
  }) {
    const { role, search, page = 1, limit = 20, department } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, data: { name?: string; department?: string; profileImage?: string; enrollmentNumber?: string; employeeId?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data,
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
  }

  async toggleActive(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }

  async getStats() {
    const [totalStudents, totalTeachers, totalAdmins, activeUsers] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return { totalStudents, totalTeachers, totalAdmins, activeUsers };
  }

  async delete(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
