import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for orphan tickets...");
  const tickets = await prisma.ticket.findMany({
    where: {
      transactionId: { not: null }
    }
  });

  for (const ticket of tickets) {
    if (ticket.transactionId) {
      const tx = await prisma.transaction.findUnique({
        where: { id: ticket.transactionId }
      });
      if (!tx) {
        console.log(`Ticket ${ticket.id} has invalid transactionId ${ticket.transactionId}. Nullifying...`);
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { transactionId: null }
        });
      }
    }
  }
  console.log("Cleanup complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// creado por pato dev y askforvini
