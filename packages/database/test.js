const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' }, take: 1 });
  if (teachers.length === 0) return console.log('No teachers');
  const teacherId = teachers[0].id;
  const classes = await prisma.class.findMany({ where: { teacherId, isActive: true }, include: { _count: { select: { enrollments: true, quizzes: true } } } });
  const quizzes = await prisma.quiz.findMany({ where: { class: { teacherId } }, include: { class: { include: { subject: true } }, _count: { select: { attempts: true } } }, orderBy: { createdAt: 'desc' }, take: 10 });
  console.log('Classes:', classes.length);
  console.log('Quizzes:', quizzes.length);
}
test().catch(console.error).finally(() => prisma.$disconnect());
