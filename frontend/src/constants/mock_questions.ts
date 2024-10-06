import { Question } from "../models/question.model";

export const mockQuestions: Question[] = [
  {
    questionId: 1,
    title: "What is a Binary Search Tree?",
    description:
      "A binary search tree is a data structure that facilitates fast lookup, addition, and removal of items.",
    categories: ["Algorithms", "Data Structures"],
    complexity: "Medium",
    link: "",
  },
  {
    questionId: 2,
    title: "Explain the concept of closures in JavaScript",
    description: "Closures are a way to access variables defined outsquestionIde of a function's scope.",
    categories: ["JavaScript", "Functional Programming"],
    complexity: "Hard",
    link: "",
  },
  {
    questionId: 3,
    title: "What is polymorphism in OOP?",
    description:
      "Polymorphism is the ability of different objects to respond in different ways to the same method call.",
    categories: ["OOP"],
    complexity: "Easy",
    link: "",
  },
  {
    questionId: 4,
    title: "Reverse a String",
    description: "Write a function that reverses a string. The input string is given as an array of characters.",
    categories: ["Strings", "Algorithms"],
    complexity: "Easy",
    link: "",
  },
];
