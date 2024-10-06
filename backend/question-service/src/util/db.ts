import mongoose from "mongoose";
import "dotenv/config";

export const connectToDB = async () => {
  try {
    let uri =
      process.env.ENV === "PROD"
        ? process.env.DB_CLOUD_URI
        : process.env.DB_LOCAL_URI;
    if (!uri) {
      throw new Error("No URI provided");
    }
    await mongoose.connect(uri, {});
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }
};
