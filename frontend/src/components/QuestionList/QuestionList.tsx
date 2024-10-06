import { ReactElement, useContext, useEffect, useState } from "react";
import { Button, IconButton, Typography } from "@mui/material";
import { DeleteForever, EditNote, OpenInNew } from "@mui/icons-material";
import { useMainDialog } from "../../contexts/MainDialogContext";
import styles from "./QuestionList.module.scss";
import { Question, QuestionComplexity } from "../../models/question.model";
import QuestionDialog from "../QuestionDialog/QuestionDialog";
import QuestionService from "../../services/question.service";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import { UserContext } from "../../contexts/UserContext";
import { isAdmin } from "../../util/user.helper";

const QuestionList = (): ReactElement => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<keyof Question>("questionId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const complexityOrder = ["Easy", "Medium", "Hard"];
  const getComplexityValue = (complexity: string) => complexityOrder.indexOf(complexity);

  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();

  const { setConfirmationDialogTitle, setConfirmationDialogContent, setConfirmationCallBack, openConfirmationDialog } =
    useConfirmationDialog();

  const { user } = useContext(UserContext);
  const canEditQuestion: boolean = isAdmin(user);

  // Shared states for adding or editing question
  const [isAddNew, setIsAddNew] = useState<boolean>(true);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState<boolean>(false);
  const [newQuestionId, setNewQuestionId] = useState<number>(0);
  const [newQuestionTitle, setNewQuestionTitle] = useState<string>("");
  const [newQuestionDescription, setNewQuestionDescription] = useState<string>("");
  const [newQuestionCategories, setNewQuestionCategories] = useState<string[]>([]);
  const [newQuestionComplexity, setNewQuestionComplexity] = useState<QuestionComplexity>("Easy");
  const [newQuestionLink, setNewQuestionLink] = useState<string>("");

  const openQuestionDialog = (question: Question | null) => {
    setIsAddNew(!question);
    setNewQuestionId(question?.questionId ?? 0);
    setNewQuestionTitle(question?.title ?? "");
    setNewQuestionDescription(question?.description ?? "");
    setNewQuestionCategories(question?.categories ?? []);
    setNewQuestionComplexity(question?.complexity ?? "Easy");
    setNewQuestionLink(question?.link ?? "");

    setIsQuestionDialogOpen(true);
  };

  const questionCallback = (question: Question | undefined, action: string) => {
    if (question) {
      // add question in frontend
      const index = questions.findIndex((q) => q.questionId === question.questionId);
      if (index !== -1) {
        questions[index] = question;
      } else {
        questions.push(question);
      }
      setQuestions([...questions]);

      setMainDialogTitle("Success");
      setMainDialogContent(`Question ${question.questionId}: "${question.title}" has been ${action} successfully`);
      openMainDialog();
    }
  };

  const showQuestionDetails = (question: Question) => () => {
    setMainDialogTitle(question.title);
    setMainDialogContent(question.description);
    openMainDialog();
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const questions = await QuestionService.getQuestions();
      setQuestions(questions);
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch questions");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSort = (key: keyof Question) => {
    const order = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(order);

    const sortedQuestions = [...questions].sort((a, b) => {
      if (key === "questionId") {
        const aId = a[key];
        const bId = b[key];
        return order === "asc" ? aId - bId : bId - aId;
      }

      if (key === "complexity") {
        const aValue = getComplexityValue(a.complexity);
        const bValue = getComplexityValue(b.complexity);
        return order === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (a[key] < b[key]) {
        return order === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return order === "asc" ? 1 : -1;
      }
      return 0;
    });

    setQuestions(sortedQuestions);
  };

  const handleDelete = (question: Question) => {
    return () => {
      setConfirmationDialogTitle("Delete Question");
      setConfirmationDialogContent(
        `Are you sure you want to delete question ${question.questionId}: "${question.title}"?`,
      );
      setConfirmationCallBack(() => async () => {
        try {
          await QuestionService.deleteQuestion(question.questionId);
          setQuestions(questions.filter((q) => q.questionId !== question.questionId));
          setMainDialogTitle("Success");
          setMainDialogContent(`Question ${question.questionId}: "${question.title}" has been deleted successfully`);
          openMainDialog();
        } catch (error: any) {
          setMainDialogTitle("Error");
          setMainDialogContent(
            `Failed to delete question ${question.questionId}: ${error?.message ?? "An unknown error occurred"}`,
          );
          openMainDialog();
        }
      });
      openConfirmationDialog();
    };
  };

  return (
    <div className={styles.container}>
      <Typography variant="h5" gutterBottom>
        Question Repository
      </Typography>
      <div className={styles.questiontablebody}>
        {loading ? (
          <Typography align="center">Loading questions...</Typography>
        ) : error ? (
          <Typography align="center" color="error">
            {error}
          </Typography>
        ) : (
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("questionId")}
                    className={`${styles.clickable} ${sortKey === "questionId" ? styles[sortOrder] : ""}`}
                  >
                    ID
                  </th>
                  <th
                    onClick={() => handleSort("title")}
                    className={`${styles.clickable} ${sortKey === "title" ? styles[sortOrder] : ""}`}
                  >
                    Title
                  </th>
                  <th>Categories</th>
                  <th
                    onClick={() => handleSort("complexity")}
                    className={`${styles.clickable} ${sortKey === "complexity" ? styles[sortOrder] : ""}`}
                  >
                    Complexity
                  </th>
                  {canEditQuestion ? <th>Actions</th> : <></>}
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.questionId}>
                    <td>{question.questionId}</td>
                    <td>
                      <Button className={styles.questiontitle} onClick={showQuestionDetails(question)}>
                        {question.title}
                      </Button>
                      <a href={question.link} target="_blank" rel="noreferrer">
                        <IconButton>
                          <OpenInNew className={styles.questionlinkicon} color="primary" />
                        </IconButton>
                      </a>
                    </td>
                    <td>
                      <div className={styles.tags}>
                        {question.categories.map((tag, index) => (
                          <span key={index} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.complexity}>{question.complexity}</td>
                    {canEditQuestion ? (
                      <td className={styles.actions}>
                        <IconButton onClick={() => openQuestionDialog(question)}>
                          <EditNote className={styles.questionediticon} />
                        </IconButton>
                        <IconButton className={styles.questiondeleteicon} onClick={handleDelete(question)}>
                          <DeleteForever />
                        </IconButton>
                      </td>
                    ) : (
                      <></>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {canEditQuestion ? (
              <Button
                className={styles.questionaddicon}
                color="primary"
                variant="contained"
                onClick={() => openQuestionDialog(null)}
              >
                Add question
              </Button>
            ) : (
              <></>
            )}
          </div>
        )}
      </div>

      <QuestionDialog
        isAddNew={isAddNew}
        isOpen={isQuestionDialogOpen}
        id={newQuestionId}
        title={newQuestionTitle}
        description={newQuestionDescription}
        categories={newQuestionCategories}
        complexity={newQuestionComplexity}
        link={newQuestionLink}
        setIsOpen={setIsQuestionDialogOpen}
        setId={setNewQuestionId}
        setMainDialogTitle={setNewQuestionTitle}
        setDescription={setNewQuestionDescription}
        setCategories={setNewQuestionCategories}
        setComplexity={setNewQuestionComplexity}
        setLink={setNewQuestionLink}
        questionCallback={questionCallback}
      />
    </div>
  );
};

export default QuestionList;
