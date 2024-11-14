import mongoose from "mongoose";
import "dotenv/config";

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

export const connectToDB = async () => {
  let retries = 0;
  let delay = INITIAL_DELAY;

  const uri =
    process.env.ENV === "PROD"
      ? process.env.DB_CLOUD_URI
      : process.env.DB_LOCAL_URI;
  if (!uri) {
    throw new Error("No URI provided");
  }

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {});
      console.log("Connected to MongoDB");
      break;
    } catch (err) {
      console.log(`Connection attempt ${retries + 1} failed:`, err);

      retries += 1;
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff: double the delay
      } else {
        console.log("Max retries reached. Could not connect to MongoDB.");
        throw new Error("Could not connect to MongoDB");
      }
    }
  }
};
