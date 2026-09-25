import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import OrderDashboardClient from "./OrderDashboardClient";

export default async function OrderDashboardPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { roles: { select: { role: true } } }
  });

  if (!user) redirect("/login");

  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
    include: {
      service: {
        include: {
          provider: { select: { id: true, name: true, avatar: true, username: true } }
        }
      },
      client: { select: { id: true, name: true, avatar: true, username: true } },
      package: true,
      milestones: { orderBy: { createdAt: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
    }
  });

  if (!order) notFound();

  // Security check: only client or provider can see this
  const isClient = order.clientId === user.id;
  const isProvider = order.service.providerId === user.id;
  const isAdmin = user.roles.some(r => r.role === 'ADMIN');

  if (!isClient && !isProvider && !isAdmin) {
    redirect("/dashboard/pedidos");
  }

  // Fetch messages/chat for this order
  // Assuming we use a general Conversation for this
  const conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { id: order.clientId } } },
        { participants: { some: { id: order.service.providerId } } }
      ],
      context: 'SERVICE_ORDER',
      contextId: order.id
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { name: true, avatar: true, id: true } } }
      }
    }
  });

  return (
    <OrderDashboardClient 
      order={JSON.parse(JSON.stringify(order))}
      user={JSON.parse(JSON.stringify(user))}
      initialMessages={JSON.parse(JSON.stringify(conversation?.messages || []))}
      conversationId={conversation?.id || null}
      isProvider={isProvider}
    />
  );
}
// creado por Patodev y Invertilo
