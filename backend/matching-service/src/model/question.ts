interface Question {
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
export default Question;
