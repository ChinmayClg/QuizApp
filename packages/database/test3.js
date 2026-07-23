const { PrismaClient } = require('./node_modules/@prisma/client');
const jwt = require('../api/node_modules/jsonwebtoken');
const prisma = new PrismaClient();

async function test() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const token = jwt.sign({ sub: teacher.id, role: 'TEACHER' }, 'quizai-dev-secret');
  
  const res = await fetch('http://localhost:3001/api/analytics/teacher/dashboard', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
