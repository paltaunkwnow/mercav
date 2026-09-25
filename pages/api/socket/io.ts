import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

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
    
    io.on("connection", (socket) => {
      console.log("Client connected", socket.id);
      
      socket.on("join", (userId) => {
        socket.join(userId);
      });
      
      socket.on("disconnect", () => {
        console.log("Client disconnected", socket.id);
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
// creado por Patodev y Invertilo
