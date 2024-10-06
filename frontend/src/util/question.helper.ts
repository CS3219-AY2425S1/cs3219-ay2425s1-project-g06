import { QuestionComplexity } from "../models/question.model";
import { parseCategories } from "./category.helper";

export type QuestionValidationFields = "id" | "title" | "description" | "categories" | "complexity" | "link";

export const QuestionValidationMaxLength: Partial<Record<QuestionValidationFields, number | null>> = {
  id: 9,
  title: 80,
  description: 2000,
  categories: 30,
  link: 200,
};

export const QuestionValidationMinLength: Partial<Record<QuestionValidationFields, number | null>> = {
  id: 1,
  title: 5,
  description: 30,
  categories: 5,
  link: 10,
};

export class QuestionValidationError extends Error {
  _field: QuestionValidationFields;

  constructor(field: QuestionValidationFields, message: string) {
    super(`Invalid ${field}: ${message}`);
    this._field = field;
  }

  public getField(): QuestionValidationFields {
    return this._field;
  }
}

const verifyLength = (value: string, field: QuestionValidationFields): void => {
  const minLength = QuestionValidationMinLength[field];
  const maxLength = QuestionValidationMaxLength[field];

  if ((minLength && value.length < minLength) || (maxLength && value.length > maxLength)) {
    throw new QuestionValidationError(
      field,
      `length should be between ${QuestionValidationMinLength[field]} and ${QuestionValidationMaxLength[field]}`,
    );
  }
};

const verifyId = (id: number): number => {
  return id;
};

const verifyTitle = (title: string): string => {
  verifyLength(title, "title");
  return title.trim();
};

const verifyDescription = (description: string): string => {
  verifyLength(description, "description");
  return description.trim();
};

const verifyCategoriesString = (categoriesString: string): string[] => {
  verifyLength(categoriesString, "categories");
  const categories = parseCategories(categoriesString);
  if (categories.length < 1) {
    throw new QuestionValidationError("categories", "no category provided");
  }
  return categories;
};

const verifyComplexity = (complexity: QuestionComplexity): QuestionComplexity => {
  if (!["Easy", "Medium", "Hard"].includes(complexity)) {
    throw new QuestionValidationError("complexity", `${complexity}`);
  }
  return complexity;
};

const verifyLink = (link: string): string => {
  verifyLength(link, "link");
  try {
    new URL(link);
  } catch (_) {
    throw new QuestionValidationError("link", "invalid URL format");
  }
  return link.trim();
};

export const verifyNewQuestion = (
  id: number,
  title: string,
  description: string,
  categoriesString: string,
  complexity: QuestionComplexity,
  link: string,
) => {
  return {
    questionId: verifyId(id),
    title: verifyTitle(title),
    description: verifyDescription(description),
    categories: verifyCategoriesString(categoriesString),
    complexity: verifyComplexity(complexity),
    link: verifyLink(link),
  };
};
