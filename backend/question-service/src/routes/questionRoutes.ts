import { Router, Request, Response } from "express";
import Question from "../models/question";
import { validate } from "class-validator";
import { Test, TestCase } from "../validator/question";
import { plainToInstance } from "class-transformer";
import { InvalidInputError, testCode } from "../util/test";

const router: Router = Router();

// Create a new question (POST)
router.post("/", async (req: Request, res: Response) => {
  const { questionId, title, description, categories, complexity, link } =
    req.body;

  try {
    const newQuestion = new Question({
      questionId,
      title,
      description,
      categories,
      complexity,
      link,
    });
    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(400).json({
      message: `Question with questionId ${questionId} already exists`,
    });
  }
});

router.post("/random", async (req: Request, res: Response) => {
  const { complexity, categories } = req.body;
  const question = await Question.find({
    complexity,
    categories: { $all: categories },
  });

  if (!question) {
    const otherQuestion = await Question.find({
      categories: { $all: categories },
    });

    if (!otherQuestion) {
      return res
        .status(404)
        .json({ message: "Question not found with given categories" });
    } else {
      const randomQuestion =
        otherQuestion[Math.floor(Math.random() * otherQuestion.length)];
      res.status(200).json(randomQuestion);
    }
  } else {
    const randomQuestion =
      question[Math.floor(Math.random() * question.length)];
    res.status(200).json(randomQuestion);
  }
});

// Get all questions (GET)
router.get("/", async (req: Request, res: Response) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server Error : Unable to fetch questions Question" });
  }
});

// Get a single question by ID (GET)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const question = await Question.findOne({
      questionId: id,
    });
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.status(200).json(question);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server Error : Unable to fetch Question" });
  }
});

// Update a question by ID (PUT)
router.put("/:id", async (req: Request, res: Response) => {
  const { title, description, categories, complexity } = req.body;

  try {
    const id = Number(req.params.id);
    const updatedQuestion = await Question.findOneAndUpdate(
      { questionId: id },
      { title, description, categories, complexity },
      { new: true },
    );
    if (!updatedQuestion)
      return res.status(404).json({ error: "Question not found" });
    res.status(200).json(updatedQuestion);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server Error : Unable to update Question" });
  }
});

// Delete a question by ID (DELETE)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const deletedQuestion = await Question.findOneAndDelete({
      questionId: id,
    });
    if (!deletedQuestion)
      return res.status(404).json({ error: "Question not found" });
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server Error : Unable to delete Question" });
  }
});

router.post("/test/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ error: "Invalid Question ID" });

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader)
      return res.status(401).json({ error: "Unauthorized" });
    const authtoken = authorizationHeader.split(" ")[1];

    const tests = plainToInstance(Test, [req.body]);
    console.assert(
      tests.length === 1,
      "tests must be an array of exactly 1 element",
    );
    const test = tests[0];
    const errors = await validate(test);
    if (errors.length > 0) {
      return res.status(400).json(errors);
    }

    const question = await Question.findOne({ questionId: id });
    if (!question) return res.status(404).json({ error: "Question not found" });

    const testCases: TestCase[] = [...question.testCases, ...test.customTests];
    const outputPromises = testCases.map((testCase) =>
      testCode(test.code, test.lang, testCase, authtoken),
    );
    try {
      const outputs = await Promise.all(outputPromises);
      return res.status(200).json({ outputs });
    } catch (err) {
      if (err instanceof InvalidInputError) {
        return res.status(400).json(err.errorObject);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error : Something went wrong" });
  }
});

export default router;
