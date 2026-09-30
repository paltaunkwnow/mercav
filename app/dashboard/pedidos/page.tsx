import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PedidosClient from "./PedidosClient";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch Service Orders (Purchases)
  const purchases = await prisma.serviceOrder.findMany({
    where: { clientId: user.id },
    include: {
      service: {
        include: {
          provider: { select: { name: true, avatar: true } }
        }
      },
      package: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch Service Orders (Sales)
  const sales = await prisma.serviceOrder.findMany({
    where: { 
      service: {
        providerId: user.id
      }
    },
    include: {
      service: true,
      client: { select: { name: true, avatar: true } },
      package: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch Space Reservations (Purchases/Advertiser)
  const spacePurchases = await prisma.reservation.findMany({
    where: { advertiserId: user.id },
    include: {
      space: true,
      space: {
        include: {
          owner: { select: { name: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch Space Reservations (Sales/Owner)
  const spaceSales = await prisma.reservation.findMany({
    where: {
      space: {
        ownerId: user.id
      }
    },
    include: {
      space: true,
      advertiser: { select: { name: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch Transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch Tickets
  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const initialTab = searchParams.tab === 'sales' ? 'sales' : 
                    searchParams.tab === 'transactions' ? 'transactions' :
                    searchParams.tab === 'tickets' ? 'tickets' : 'purchases';

  return (
    <PedidosClient 
      user={JSON.parse(JSON.stringify(user))}
      purchases={JSON.parse(JSON.stringify(purchases))} 
      sales={JSON.parse(JSON.stringify(sales))}
      spacePurchases={JSON.parse(JSON.stringify(spacePurchases))}
      spaceSales={JSON.parse(JSON.stringify(spaceSales))}
      transactions={JSON.parse(JSON.stringify(transactions))}
      tickets={JSON.parse(JSON.stringify(tickets))}
      initialTab={initialTab}
    />
  );
}
// creado por pato dev y askforvini
