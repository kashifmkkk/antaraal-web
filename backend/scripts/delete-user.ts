import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: ts-node scripts/delete-user.ts user@example.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found:', email);
    process.exit(0);
  }

  const vendorId = user.vendorId;
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user ${email} (id=${user.id})`);

  if (vendorId) {
    const usersRemaining = await prisma.user.count({ where: { vendorId } });
    if (usersRemaining === 0) {
      await prisma.vendor.delete({ where: { id: vendorId } });
      console.log(`Deleted vendor id=${vendorId}`);
    } else {
      console.log(`Vendor id=${vendorId} has ${usersRemaining} remaining users; not deleting vendor.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
