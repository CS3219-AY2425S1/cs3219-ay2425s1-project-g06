export type QuestionComplexity = "Easy" | "Medium" | "Hard";

export enum Categories {
  ALGORITHMS = "Algorithms",
  ARRAYS = "Arrays",
  BIT_MANIPULATION = "Bit Manipulation",
  BRAINTEASER = "Brainteaser",
  DATABASES = "Databases",
  DATA_STRUCTURES = "Data Structures",
  RECURSION = "Recursion",
  STRINGS = "Strings",
}

export interface Question {
  questionId: number;
  title: string;
  description: string;
  categories: Categories[];
  complexity: QuestionComplexity;
  link: string;
}
