import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SanctionClient from "./SanctionClient";

export default async function SanctionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user?.isSanctioned) redirect("/dashboard");

  const timeLeft = user.sanctionExpiresAt 
    ? Math.max(0, new Date(user.sanctionExpiresAt).getTime() - new Date().getTime())
    : null;
    
  const days = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60 * 24)) : null;
  const hours = timeLeft ? Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null;

  return <SanctionClient user={user} days={days} hours={hours} timeLeft={timeLeft} />;
}
