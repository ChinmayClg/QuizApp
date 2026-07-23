const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' }});
  for (const t of teachers) {
    const classes = await prisma.class.count({ where: { teacherId: t.id } });
    const quizzes = await prisma.quiz.count({ where: { class: { teacherId: t.id } } });
    console.log(t.email, t.name, 'Classes:', classes, 'Quizzes:', quizzes);
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
