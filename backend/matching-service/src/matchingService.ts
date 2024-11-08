import { sendToQueue, sendDelayedMessage } from "./rabbitmq";
import { io } from "./server";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { fetchRandomQuestion } from "./util";
import exp from "constants";

const prisma = new PrismaClient();

const DELAY_TIME = 30000;
const CONFIRM_DELAY_TIME = 10000;

export async function handleMatchingRequest(userRequest: any, socketId: string) {
  userRequest.socketId = socketId;

  addUserToQueue(userRequest);
  sendDelayedTimeoutMessage(userRequest);
}

function addUserToQueue(userRequest: any) {
  sendToQueue(userRequest);
  console.log("Sent user request to queue:", userRequest);
}

function sendDelayedTimeoutMessage(userRequest: any) {
  userRequest["type"] = "timeout";
  sendDelayedMessage(userRequest, DELAY_TIME);
  console.log("Sent delayed message for user request:", userRequest);
}

function sendConfirmDelayedTimeoutMessage(recordId: string) {
  sendDelayedMessage(
    {
      recordId: recordId,
      type: "confirm_timeout",
    },
    CONFIRM_DELAY_TIME
  );
  console.log("Sent delayed message for confirm timeout for recordId: ", recordId);
}

export async function handleUserRequest(userRequest: any) {
  const { userId, topic, difficulty, socketId } = userRequest;

  // Check if user already has a match record
  const user = await prisma.matchRecord.findFirst({
    where: { userId, isPending: false, isArchived: false },
  });
  if (user !== null) {
    console.log("User already present in match record");
    const pastSocketId = user.socketId;
    if (pastSocketId !== socketId) {
      console.log("Duplicate socket detected. New socket will be used.");
      io.to(pastSocketId).emit(
        "duplicate socket",
        "New connection detected for the same user. Please close the current page"
      );

      // Update socket ID upon potential reconnection
      await prisma.matchRecord.update({
        where: { recordId: user.recordId },
        data: { socketId },
      });
    }
    console.log(user);
    return;
  }

  // Check if there is an existing match
  const existingMatch = await prisma.matchRecord.findFirst({
    where: {
      topic,
      difficulty,
      matched: false,
      isArchived: false,
      NOT: { userId },
    },
  });

  if (existingMatch !== null) {
    const roomNumber = uuidv4();
    const question = await fetchRandomQuestion(difficulty, topic);

    if (!question) {
      io.to(socketId).emit("question_error", {
        message: "No Question found for the selected topic and difficulty",
      });
      io.to(existingMatch.socketId).emit("question_error", {
        message: "No Question found for the selected topic and difficulty",
      });
      await prisma.matchRecord.delete({
        where: { recordId: existingMatch.recordId },
      });
      return;
    }
    // Match found, update both records to mark as isPending
    await prisma.matchRecord.update({
      where: { recordId: existingMatch.recordId },
      data: { matched: true, matchedUserId: userId, isPending: true },
    });
    const current = await prisma.matchRecord.create({
      data: {
        userId,
        topic,
        difficulty,
        socketId,
        matched: true,
        matchedUserId: existingMatch.userId,
        isPending: true,
        roomNumber,
        questionId: question?.questionId as number,
      },
    });

    // Update both clients about the successful match
    io.to(socketId).emit("matched", {
      matchedWith: existingMatch.userId,
      roomNumber,
      questionId: question?.questionId,
    });
    io.to(existingMatch.socketId).emit("matched", {
      matchedWith: userId,
      roomNumber,
      questionId: question?.questionId,
    });

    // Add confirm timeout messages
    sendConfirmDelayedTimeoutMessage(current.recordId.toString());
    sendConfirmDelayedTimeoutMessage(existingMatch.recordId.toString());
  } else {
    const roomNumber = uuidv4();
    await prisma.matchRecord.create({
      data: {
        userId,
        topic,
        difficulty,
        socketId,
        matched: false,
        roomNumber,
      },
    });

    console.log(`No match found for ${userId}, added to record`);
  }
}

export async function handleMatchingConfirm(userRequest: any) {
  const { userId } = userRequest;
  const userRecord = await prisma.matchRecord.findFirst({
    where: { userId, isPending: true, isArchived: false },
  });
  const matchedRecord = await prisma.matchRecord.findFirst({
    where: { matchedUserId: userId, isPending: true, isArchived: false },
  });

  // check if both records are present
  if (matchedRecord === null || userRecord === null) {
    // archive both records if one of them is missing
    if (matchedRecord !== null) {
      await prisma.matchRecord.update({
        where: { recordId: matchedRecord.recordId },
        data: { isArchived: true },
      });
      io.to(matchedRecord.socketId).emit("other_declined", "Match not confirmed. Please try again.");
    }
    if (userRecord !== null) {
      await prisma.matchRecord.update({
        where: { recordId: userRecord.recordId },
        data: { isArchived: true },
      });
      io.to(userRecord.socketId).emit("other_declined", "Match not confirmed. Please try again.");
    }
    return;
  }

  if (userRecord.isConfirmed === true) {
    console.log("User already confirmed match");
    return;
  }

  // update userRecord isConfirmed
  await prisma.matchRecord.update({
    where: { recordId: userRecord.recordId },
    data: { isConfirmed: true },
  });

  if (matchedRecord.isConfirmed === true) {
    // both confirmed, match is successful
    console.log(`User ${userId} confirmed match, both users confirmed`);
    // mark both archived
    await prisma.matchRecord.update({
      where: { recordId: matchedRecord.recordId },
      data: { isArchived: true },
    });
    await prisma.matchRecord.update({
      where: { recordId: userRecord.recordId },
      data: { isArchived: true },
    });
    await prisma.sessionHistory.create({
      data: {
        roomNumber: matchedRecord.roomNumber,
        questionId: matchedRecord.questionId ?? userRecord.questionId ?? 0,
        isOngoing: true,
        userOneId: userRecord.userId,
        userTwoId: matchedRecord.userId,
      },
    });

    io.to(userRecord.socketId).emit("matching_success", "Match confirmed. Proceeding to collaboration service.");
    io.to(matchedRecord.socketId).emit("matching_success", "Match confirmed. Proceeding to collaboration service.");
    // TODO: add further logic here to proceed to collaboration service
  } else {
    console.log(`User ${userId} confirmed match, waiting for other user to confirm`);
    io.to(matchedRecord.socketId).emit("other_accepted", "Other user confirmed match. Please confirm.");
  }
}

export async function handleMatchingDecline(userRequest: any) {
  const { userId } = userRequest;
  const userRecord = await prisma.matchRecord.findFirst({
    where: { userId, isPending: true, isArchived: false },
  });
  const matchedRecord = await prisma.matchRecord.findFirst({
    where: { matchedUserId: userId, isPending: true, isArchived: false },
  });

  // check if both records are present
  if (matchedRecord === null || userRecord === null) {
    // archive both records if one of them is missing
    if (matchedRecord !== null) {
      await prisma.matchRecord.update({
        where: { recordId: matchedRecord.recordId },
        data: { isArchived: true },
      });
      io.to(matchedRecord.socketId).emit("other_declined", "Match not confirmed. Please try again.");
      io.to(matchedRecord.socketId).emit("matching_fail", "Match not confirmed. Please try again.");
    }
    if (userRecord !== null) {
      await prisma.matchRecord.update({
        where: { recordId: userRecord.recordId },
        data: { isArchived: true },
      });
      io.to(userRecord.socketId).emit("other_declined", "Match not confirmed. Please try again.");
      io.to(userRecord.socketId).emit("matching_fail", "Match not confirmed. Please try again.");
    }

    return;
  }

  await prisma.matchRecord.update({
    where: { recordId: userRecord.recordId },
    data: { isArchived: true },
  });

  // user decline, match failed regardlessly
  console.log(`User ${userId} declined match`);
  io.to(matchedRecord.socketId).emit("other_declined", "Match not confirmed. Please try again.");
  await prisma.matchRecord.update({
    where: { recordId: matchedRecord.recordId },
    data: { isArchived: true },
  });

  io.to(userRecord.socketId).emit("matching_fail", "Match not confirmed. Please try again.");
  io.to(matchedRecord.socketId).emit("matching_fail", "Match not confirmed. Please try again.");
}

export async function handleTimeout(userRequest: any) {
  const { userId, socketId } = userRequest;
  // only non-active matches are archived
  const result = await prisma.matchRecord.findFirst({
    where: { userId, isPending: false, isArchived: false, socketId },
  });

  if (result !== null) {
    if (result.matched === false) {
      console.log(`Timeout: No match found for user ${userId}`);
      io.to(socketId).emit("timeout", "No match found. Please try again.");
    }

    await prisma.matchRecord.update({
      where: { recordId: result.recordId },
      data: { isArchived: true },
    });
  }
}

export async function handleConfirmTimeout(recordId: string) {
  const recordIdInt = Number(recordId);
  const result = await prisma.matchRecord.findUnique({
    where: { recordId: recordIdInt, isArchived: false },
  });
  console.log(`Timeout: Confirm timeout for recordId ${recordId}`);
  if (result !== null) {
    if (result.isConfirmed === false) {
      console.log(`Timeout: Match not confirmed for recordId ${recordId} with userId ${result.userId}`);
    } else {
      console.log(
        `Timeout: Match confirmed for recordId ${recordId} with userId ${result.userId} but other user did not confirm`
      );
    }
    io.to(result.socketId).emit("matching_fail", "Match not confirmed. Please try again.");
    await prisma.matchRecord.update({
      where: { recordId: recordIdInt },
      data: { isArchived: true },
    });
  }
}

export async function handleDisconnected(socketId: string) {
  const result = await prisma.matchRecord.findMany({
    where: { socketId },
  });
  if (result !== null) {
    await prisma.matchRecord.updateMany({
      where: { socketId },
      data: { isArchived: true },
    });
  }
}
