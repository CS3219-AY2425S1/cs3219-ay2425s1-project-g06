import React, { useState, useEffect, ReactElement } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button, Chip, Typography } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { autocompletion } from "@codemirror/autocomplete";
import "./CodeViewer.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { Extension } from "@codemirror/state";
import QuestionService from "../../services/question.service";
import { Language } from "../../services/session.service";

interface QuestionData {
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

const CodeViewer = (): ReactElement => {
  const location = useLocation();
  const state = location.state || {};
  const navigate = useNavigate();

  if (!state.questionId) {
    navigate("/");
  }
  const questionId = state.questionId as number;
  const language: Language = state.language ?? "python";
  const code: string = state.code ?? "# No code was submitted during this session";

  const [questionData, setQuestionData] = useState<QuestionData | null>(null);

  const languageExtensions: { [key in Language]: Extension[] } = {
    python: [python(), autocompletion()],
    cpp: [cpp(), autocompletion()],
    java: [java(), autocompletion()],
  };

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        const response = await QuestionService.getQuestion(questionId);
        setQuestionData(response);
      } catch (error) {
        console.error("Failed to fetch question data:", error);
      }
    };

    fetchQuestionData();
  }, [questionId]);

  return (
    <div className="app-container">
      <div className="container">
        <div className="top-section">
          <Typography variant="h3" className="question-title">
            {questionData?.title}
          </Typography>

          <div className="details">
            <Chip label={`Difficulty: ${questionData?.complexity}`} className="detail-chip light-grey-chip" />
            <Chip label={`Topic: ${questionData?.categories.join(", ")}`} className="detail-chip light-grey-chip" />
            <Chip
              label={`URL: ${questionData?.link}`}
              className="detail-chip light-grey-chip"
              clickable
              onClick={() => window.open(questionData?.link, "_blank")}
              icon={<OpenInNewIcon style={{ color: "#caff33" }} />}
            />
          </div>
        </div>

        <div className="editors">
          <div className="left-side">
            <MDEditor.Markdown source={questionData?.description || ""} className="md-editor" />
          </div>

          <div className="right-side">
            <div className="header">
              <Chip label={language} className="detail-chip light-grey-chip" />
              <div></div>
            </div>
            <CodeMirror
              value={code}
              readOnly
              height="500px"
              style={{ fontSize: "18px" }}
              extensions={[...(languageExtensions[language] || [])]}
              theme={okaidia}
            />
          </div>
        </div>

        <div className="buttons">
          <Button
            variant="contained"
            className="buttons-leave"
            onClick={() => {
              navigate(-1);
            }}
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodeViewer;
