const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const users = await prisma.user.findMany({
    include: {
      teacherClasses: true,
      attempts: true
    }
  });
  console.log(users.map(u => ({
    email: u.email,
    role: u.role,
    classes: u.teacherClasses.length,
    attempts: u.attempts.length
  })));
}
test().catch(console.error).finally(() => prisma.$disconnect());
