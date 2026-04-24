import { PrismaClient, Plan } from '@prisma/client';

async function main() {
  const [, , emailArg, planArg] = process.argv;

  if (!emailArg || !planArg) {
    console.error('Usage: pnpm dlx tsx scripts/set-user-plan.ts <email> <FREE|STARTER|PRO>');
    process.exit(1);
  }

  const plan = planArg.toUpperCase() as Plan;
  if (!['FREE', 'STARTER', 'PRO'].includes(plan)) {
    console.error(`Invalid plan "${planArg}". Must be one of: FREE, STARTER, PRO`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email: emailArg },
      data: { plan },
      select: { id: true, email: true, name: true, plan: true },
    });
    console.log(`✅ Updated ${user.email} → plan=${user.plan} (id=${user.id}, name=${user.name ?? '-'})`);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      console.error(`❌ No user found with email: ${emailArg}`);
    } else {
      console.error('❌ Failed to update user plan:', err);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
