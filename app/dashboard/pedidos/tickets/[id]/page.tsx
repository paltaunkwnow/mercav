import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketDetailClient from "./TicketDetailClient";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: true }
  });

  const roles = user?.roles.map(r => r.role) || [];
  const userWithRoles = { ...user, roles };

  if (!user) redirect("/auth/login");

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      order: true,
      replies: {
        include: {
          user: { select: { name: true, avatar: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const userRoles = (session.user as any).roles || [];
  const isAdmin = userRoles.includes("ADMIN");

  if (!ticket || (ticket.userId !== user.id && ticket.involvedUserId !== user.id && !isAdmin)) {
    redirect("/dashboard/pedidos");
  }

  return (
    <TicketDetailClient 
      ticket={JSON.parse(JSON.stringify(ticket))}
      user={JSON.parse(JSON.stringify(userWithRoles))}
    />
  );
}
// creado por pato dev y askforvini
