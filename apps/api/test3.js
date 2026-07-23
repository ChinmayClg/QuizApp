const { PrismaClient } = require('../../packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const teacherId = teacher.id;
  console.log('Teacher:', teacherId);

  const [classes, quizzes] = await Promise.all([
    prisma.class.findMany({
      where: { teacherId, isActive: true },
      include: { _count: { select: { enrollments: true, quizzes: true } } },
    }),
    prisma.quiz.findMany({
      where: { class: { teacherId } },
      include: {
        class: { include: { subject: true } },
        _count: { select: { attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  console.log('Classes length:', classes.length);
  console.log('Quizzes length:', quizzes.length);

  try {
    const recentQuizzes = quizzes.slice(0, 5).map((q) => ({
      id: q.id,
      title: q.title,
      className: q.class.name,
      subjectName: q.class.subject.name,
      status: q.status,
      attemptCount: q._count.attempts,
      createdAt: q.createdAt,
    }));
    console.log('Mapped recent quizzes perfectly');
  } catch(e) {
    console.error('Error mapping recent quizzes:', e);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
