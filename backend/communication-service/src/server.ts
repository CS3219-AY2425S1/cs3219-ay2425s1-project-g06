import express, { Application } from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import { PeerServer } from "peer";
import { PrismaClient } from "@prisma/client";
import { configDotenv } from "dotenv";

configDotenv();

const prisma = new PrismaClient();

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3004;

app.use(cors());

async function main() {
  io.on("connection", (socket) => {
    let userId: string | undefined;
    let roomId: string | undefined;
    console.log(`User connected: ${socket.id}`);
    socket.on("rejoin-room", async (uid: string) => {
      userId = uid;
      const userRecord = await prisma.userRoomMapping.findFirst({
        where: {
          userId,
        },
      });
      console.log("Reconnecting user:", userId);
      if (userRecord) {
        roomId = userRecord.roomId;
        console.log(`${userId} re-joined room: ${roomId}`);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-reconnected", userId);
        socket.emit("rejoin-room", roomId);
      }
    });

    socket.on("join-room", async (uid: string, rid: string) => {
      userId = uid;
      roomId = rid;
      await prisma.userRoomMapping.deleteMany({
        where: {
          userId,
        },
      });
      socket.join(roomId);
      await prisma.userRoomMapping.create({
        data: {
          userId,
          roomId,
        },
      });
      console.log(`${userId} joined room: ${roomId}`);
      socket.broadcast.to(roomId).emit("user-connected", userId);
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.id}`);
      if (roomId && userId) {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      }
    });

    socket.on(
      "send-message",
      (message: string, senderId: string, senderName: string, rid: string) => {
        io.to(rid).emit(
          "receive-message",
          message,
          senderId,
          senderName,
          Date.now(),
        );
      },
    );
  });

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  const PEERJS_PORT = Number(process.env.PEERJS_PORT) || 9000;

  const peerServer = PeerServer({
    port: PEERJS_PORT,
    path: "/peerjs",
  });

  peerServer.on("connection", (client) => {
    console.log(`Peer connected: ${client.getId()}`);
  });

  peerServer.on("disconnect", (client) => {
    console.log(`Peer disconnected: ${client.getId()}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
