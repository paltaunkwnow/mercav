import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

import { getToken } from "next-auth/jwt";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    io.use(async (socket, next) => {
      try {
        const token = await getToken({
          req: socket.request as any,
          secret: process.env.NEXTAUTH_SECRET,
        });
        if (token?.id) {
          socket.data.userId = token.id;
        }
        next();
      } catch {
        next();
      }
    });
    
    io.on("connection", (socket) => {
      socket.on("join", (userId) => {
        // Solo permitir unirse a su propia sala
        if (!socket.data.userId || socket.data.userId === userId) {
          socket.join(userId);
        }
      });

      socket.on("joinConv", (convId) => {
        if (typeof convId === "string" && convId.length <= 100) {
          socket.join(`chat:${convId}`);
        }
      });
      
      socket.on("disconnect", () => {
        // disconnected
      });
    });

    res.socket.server.io = io;
    // also expose globally so app-router API routes can emit events
    try {
      (globalThis as any).io = io;
    } catch (e) {
      // ignore
    }
  }
  
  res.end();
};

export default ioHandler;
// creado por pato dev y askforvini
