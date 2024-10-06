import axios from "axios";
import { Question, QuestionComplexity } from "../models/question.model";
import { verifyNewQuestion } from "../util/question.helper";

export default class QuestionService {
  private static client = axios.create({
    baseURL: process.env.REACT_APP_QUESTION_SERVICE_URL as string,
    headers: {
      "Content-type": "application/json",
    },
  });

  static async getQuestions(): Promise<Question[]> {
    const response = await QuestionService.client.get("/");
    let questions = response.data.sort((a: Question, b: Question) => a.questionId - b.questionId);
    return questions;
  }

  static async addQuestion(
    id: number,
    title: string,
    description: string,
    categoriesString: string,
    complexity: QuestionComplexity,
    link: string,
  ): Promise<any> {
    const body = verifyNewQuestion(id, title, description, categoriesString, complexity, link);
    const response = await QuestionService.client.post("/", body);
    return response.data;
  }

  static async editQuestion(
    id: number,
    title: string,
    description: string,
    categoriesString: string,
    complexity: QuestionComplexity,
    link: string,
  ): Promise<any> {
    const body = verifyNewQuestion(id, title, description, categoriesString, complexity, link);
    const response = await QuestionService.client.put(`/${id}`, body);
    return response.data;
  }

  static async deleteQuestion(id: number): Promise<any> {
    const response = await QuestionService.client.delete(`/${id}`);
    return response.data;
  }
}
