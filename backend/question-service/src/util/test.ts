import "dotenv/config";
import { TestCase } from "../validator/question";

const url = process.env.CODE_EXECUTION_SERVICE_URL as string;
if (!url) {
  throw new Error("CODE_EXECUTION_SERVICE_URL is not defined in env");
}

export class InvalidInputError extends Error {
  errorObject: any;

  constructor(errorObject: any) {
    super("Invalid input");
    this.name = "InvalidInputError";
    this.errorObject = errorObject;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CodeOutput {
  output: string;
  error: string;
  isCorrect: boolean | null;
}

function compareOutput(actual?: string, expected?: string): boolean | null {
  if (expected === undefined || expected === null) {
    return null;
  }
  if (actual === undefined || actual === null) {
    return false;
  }

  const actualLines = actual
    .trim()
    .split("\n")
    .map((line) => line.trim());
  const expectedLines = expected
    .trim()
    .split("\n")
    .map((line) => line.trim());
  if (actualLines.length !== expectedLines.length) {
    return false;
  }
  for (let i = 0; i < actualLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      return false;
    }
  }
  return true;
}

export async function testCode(
  code: string,
  lang: string,
  testCase: TestCase,
  authtoken: string,
): Promise<CodeOutput> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authtoken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, lang, input: testCase.input, timeout: 5 }),
  });
  if (response.status >= 400 && response.status < 500) {
    throw new InvalidInputError(await response.json());
  }

  const id = (await response.json()).id;
  for (let i = 0; i < 15; i++) {
    await sleep(500);
    const resultResponse = await fetch(`${url}/?id=${id}`, {
      headers: {
        Authorization: `Bearer ${authtoken}`,
      },
    });
    if (resultResponse.status >= 400 && resultResponse.status < 500) {
      throw new Error("Execution error");
    }

    const result = await resultResponse.json();
    if (result.status !== "finished") {
      continue;
    }

    return {
      output: result.output,
      error: result.error,
      isCorrect: compareOutput(result.output, testCase.output),
    };
  }

  throw new Error("Timeout");
}
