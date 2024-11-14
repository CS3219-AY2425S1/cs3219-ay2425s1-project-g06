import { Schema, model, Document } from "mongoose";

interface IQuestion extends Document {
  questionId: Number;
  title: string;
  description: string;
  categories: string[];
  complexity: "Easy" | "Medium" | "Hard";
  link: string;
  testCases: {
    input: string;
    output: string;
  }[];
}

const questionSchema = new Schema<IQuestion>({
  questionId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  categories: { type: [String], required: true },
  complexity: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true,
  },
  link: { type: String, required: true },
  testCases: {
    type: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
      },
    ],
    required: true,
  },
});

const Question = model<IQuestion>("Question", questionSchema);
export default Question;
