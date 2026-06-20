import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      jobPosts: {
        include: {
          _count: { select: { applications: true, savedBy: true } }
        }
      },
      spaces: {
        include: {
          _count: { select: { savedBy: true, reservations: true } },
          reservations: {
            where: { status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } },
            select: { ownerFee: true }
          }
        }
      },
      services: {
        include: {
          _count: { select: { savedBy: true, orders: true } },
          orders: {
            where: { status: { in: ['COMPLETED', 'IN_PROGRESS', 'IN_REVIEW'] } },
            select: { providerPayout: true }
          }
        }
      },
      posConfig: true,
      badges: true
    }
  });

  if (!user) redirect('/login');

  const totalApplicants = user.jobPosts.reduce((acc, job) => acc + (job as any)._count?.applications || 0, 0);
  const totalViews = user.jobPosts.reduce((acc, job) => acc + (job.viewCount || 0), 0);
  
  // Earnings from services
  const serviceEarnings = user.services.reduce((acc, service) => 
    acc + service.orders.reduce((sum, order) => sum + Number(order.providerPayout), 0), 0);
    
  // Earnings from spaces
  const spaceEarnings = user.spaces.reduce((acc, space) => 
    acc + space.reservations.reduce((sum, res) => sum + Number(res.ownerFee), 0), 0);
    
  const totalEarnings = serviceEarnings + spaceEarnings;
  
  // "Interesados" are people who saved the user's posts, spaces or services
  const totalSaved = 
    user.jobPosts.reduce((acc, job) => acc + job._count.savedBy, 0) +
    user.spaces.reduce((acc, space) => acc + space._count.savedBy, 0) +
    user.services.reduce((acc, service) => acc + service._count.savedBy, 0);

  return (
    <DashboardClient 
      user={user} 
      totalApplicants={totalApplicants} 
      totalViews={totalViews}
      totalEarnings={totalEarnings}
      totalSaved={totalSaved}
    />
  );
}
