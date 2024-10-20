import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import questionRoutes from "./routes/questionRoutes";
import { connectToDB } from "./util/db";
import dotenv from "dotenv";

// Initialize the app
const app: Application = express();
dotenv.config();

const PORT = process.env.PORT || 3002;

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

// Routes
app.use("/", questionRoutes);

// Start the server
app.listen(PORT, () => {
  connectToDB();
  console.log(`Server running on port ${PORT}`);
});
