const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.role === 'TEACHER') {
      const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: 'password123' })
      });
      if (!loginRes.ok) continue;
      const token = (await loginRes.json()).data.accessToken;
      const res = await fetch('http://localhost:3001/api/analytics/teacher/dashboard', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log(`Teacher ${u.email}:`, res.status);
    } else if (u.role === 'STUDENT') {
      const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: 'password123' })
      });
      if (!loginRes.ok) continue;
      const token = (await loginRes.json()).data.accessToken;
      const res = await fetch('http://localhost:3001/api/analytics/student/dashboard', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      console.log(`Student ${u.email}:`, res.status);
    }
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
