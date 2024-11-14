import axios from "axios";
import { configDotenv } from "dotenv";
import Question from "./model/question";

configDotenv();
const fetchRandomQuestion = async (
  complexity: string,
  categories: string,
): Promise<Question | null> => {
  const response = await axios.post(`${process.env.QUESTION_SERVICE}/random`, {
    complexity,
    categories,
  });
  if (response.status !== 200) {
    return null;
  } else {
    return response.data;
  }
};

export { fetchRandomQuestion };
