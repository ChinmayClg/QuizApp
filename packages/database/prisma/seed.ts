import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dummy accounts...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      name: 'Test Teacher',
      passwordHash,
      role: Role.TEACHER,
      department: 'Computer Science',
      employeeId: 'T-1001'
    }
  });
  console.log('Teacher Account:', { email: teacher.email, password: 'password123' });

  // Create Student
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      name: 'Test Student',
      passwordHash,
      role: Role.STUDENT,
      department: 'Computer Science',
      enrollmentNumber: 'S-2001'
    }
  });
  console.log('Student Account:', { email: student.email, password: 'password123' });

  // Create a dummy subject and class so the teacher has something to look at
  const dept = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: { name: 'Computer Science', code: 'CS' }
  });

  const subject = await prisma.subject.upsert({
    where: { code: 'CS101' },
    update: {},
    create: { name: 'Intro to Programming', code: 'CS101', departmentId: dept.id }
  });

  const classRoom = await prisma.class.upsert({
    where: { joinCode: 'CS101-2026' },
    update: {},
    create: {
      name: 'Batch A - CS101',
      subjectId: subject.id,
      teacherId: teacher.id,
      joinCode: 'CS101-2026',
      academicYear: '2025-26',
      section: 'A'
    }
  });

  // Enroll student
  await prisma.classEnrollment.upsert({
    where: { classId_studentId: { classId: classRoom.id, studentId: student.id } },
    update: {},
    create: { classId: classRoom.id, studentId: student.id }
  });

  console.log('✅ Dummy data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
