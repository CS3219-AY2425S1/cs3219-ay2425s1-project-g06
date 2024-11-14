import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupRabbitMQ } from "./rabbitmq";
import {
  handleMatchingRequest,
  handleMatchingConfirm,
  handleMatchingDecline,
  handleDisconnected,
} from "./matchingService";

import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

const prisma = new PrismaClient();

app.post("/check", async (req, res) => {
  if (!req.body.data) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const { userId, roomId } = req.body.data;

  const record = await prisma.matchRecord.findFirst({
    where: {
      roomNumber: roomId,
      OR: [
        {
          userId: userId,
        },
        {
          matchedUserId: userId,
        },
      ],
    },
  });

  if (!record) {
    res.status(200).json({ hasAccess: false });
  } else {
    res.status(200).json({ hasAccess: true });
  }
});

app.get("/session", async (req, res) => {
  if (!req.query.userId) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const userId = req.query.userId as string;

  const record = await prisma.sessionHistory.findFirst({
    where: {
      OR: [
        {
          userOneId: userId,
        },
        {
          userTwoId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!record) {
    res.status(200).json({ session: null });
  } else {
    const session = {
      isOngoing: record.isOngoing,
      roomNumber: record.roomNumber,
      questionId: record.questionId,
      otherUserId: record.userOneId === userId ? record.userTwoId : record.userOneId,
      submission: record.submission,
      language: record.language,
      createdAt: record.createdAt,
    };
    res.status(200).json({ session: session });
  }
});

app.get("/session-history", async (req, res) => {
  if (!req.query.userId) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const userId = req.query.userId as string;
  const count = req.query.count ? parseInt(req.query.count as string) : 3;

  const records = await prisma.sessionHistory.findMany({
    where: {
      OR: [
        {
          userOneId: userId,
        },
        {
          userTwoId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: count,
  });

  if (!records || records.length === 0) {
    res.status(200).json({ sessions: [] });
  } else {
    const sessions = records.map((record) => ({
      isOngoing: record.isOngoing,
      roomNumber: record.roomNumber,
      questionId: record.questionId,
      otherUserId: record.userOneId === userId ? record.userTwoId : record.userOneId,
      submission: record.submission,
      language: record.language,
      createdAt: record.createdAt,
    }));
    res.status(200).json({ sessions: sessions });
  }
});

app.put("/leave-session", async (req, res) => {
  if (!req.body.data) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const { userId, roomId } = req.body.data;
  const record = await prisma.sessionHistory.findFirst({
    where: {
      isOngoing: true,
      roomNumber: roomId,
      OR: [
        {
          userOneId: userId,
        },
        {
          userTwoId: userId,
        },
      ],
    },
  });
  if (!record) {
    res.status(404).json({ error: "Request did not match with any ongoing session that the user is in." });
    return;
  } else {
    const isUserOneActive = record.userOneId === userId ? false : record.isUserOneActive;
    const isUserTwoActive = record.userTwoId === userId ? false : record.isUserTwoActive;
    const isOngoing = isUserOneActive || isUserTwoActive;
    await prisma.sessionHistory.update({
      where: {
        sessionId: record.sessionId,
      },
      data: {
        isUserOneActive: isUserOneActive,
        isUserTwoActive: isUserTwoActive,
        isOngoing: isOngoing,
      },
    });
  }
  res.status(200).json({ ok: "ok" });
});

app.put("/rejoin-session", async (req, res) => {
  if (!req.body.data) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const { userId, roomId } = req.body.data;
  const record = await prisma.sessionHistory.findFirst({
    where: {
      isOngoing: true,
      roomNumber: roomId,
      OR: [
        {
          userOneId: userId,
        },
        {
          userTwoId: userId,
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (!record) {
    res.status(404).json({ error: "Request did not match with any ongoing session that the user is in." });
  } else {
    await prisma.sessionHistory.update({
      where: {
        sessionId: record.sessionId,
      },
      data: record.userOneId === userId ? { isUserOneActive: true } : { isUserTwoActive: true },
    });
    res.status(200).json({
      roomNumber: record.roomNumber,
      questionId: record.questionId,
      otherUserId: record.userOneId === userId ? record.userTwoId : record.userOneId,
    });
  }
});

app.put("/submit-session", async (req, res) => {
  if (!req.body.data) {
    res.status(400).json({ error: "Request was malformed." });
    return;
  }
  const { userId, roomId, submission, language } = req.body.data;
  const record = await prisma.sessionHistory.findFirst({
    where: {
      isOngoing: true,
      roomNumber: roomId,
      OR: [
        {
          userOneId: userId,
        },
        {
          userTwoId: userId,
        },
      ],
    },
  });
  if (!record) {
    res.status(404).json({ error: "Request did not match with any ongoing session that the user is in." });
    return;
  } else {
    await prisma.sessionHistory.update({
      where: {
        sessionId: record.sessionId,
      },
      data: {
        isOngoing: false,
        isUserOneActive: false,
        isUserTwoActive: false,
        submission: submission,
        language: language,
      },
    });
  }
  res.status(200).json({ ok: "ok" });
});

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3003;

function setupSocketIO(io: Server) {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("matching_request", async (userRequest) => {
      console.log("Matching request received:", userRequest);
      await handleMatchingRequest(userRequest, socket.id);
    });

    socket.on("matching_confirm", async (userRequest) => {
      console.log("Matching confirmed:", userRequest);
      await handleMatchingConfirm(userRequest);
    });

    socket.on("matching_decline", async (userRequest) => {
      console.log("Matching declined:", userRequest);
      await handleMatchingDecline(userRequest);
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);
      await handleDisconnected(socket.id);
    });
  });
}

async function startServer() {
  try {
    await setupRabbitMQ();

    setupSocketIO(io);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
