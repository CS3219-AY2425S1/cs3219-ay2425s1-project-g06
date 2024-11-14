import axios from "axios";
import { Question, QuestionComplexity } from "../models/question.model";
import { verifyNewQuestion } from "../util/question.helper";

export default class QuestionService {
  private static client = QuestionService.createClient();

  private static createClient() {
    const client = axios.create({
      baseURL: process.env.REACT_APP_QUESTION_SERVICE_URL as string,
      headers: {
        "Content-type": "application/json",
      },
    });
    client.interceptors.request.use((config) => {
      const token = localStorage.getItem("jwt-token");
      if (token) {
        config.headers["Authorization"] = token;
      }
      return config;
    });
    return client;
  }

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

  static async getQuestion(id: number): Promise<Question> {
    const response = await QuestionService.client.get(`/${id}`);
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

  static async test(id: number, payload: any): Promise<any> {
    const response = await QuestionService.client.post(`/test/${id}`, payload);
    return response.data;
  }
}
