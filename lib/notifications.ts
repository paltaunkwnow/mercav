import { prisma } from "./prisma";

export async function createNotification(userId: string, type: string, title: string, body: string, link?: string) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        link,
        isRead: false
      }
    });
    
    // Aquí se emitiría el socket: io.to(userId).emit("notification", notification)
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}
