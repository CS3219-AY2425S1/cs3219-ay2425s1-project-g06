import React, { useEffect, useState } from "react";
import { Typography, Button, CircularProgress, Tabs, Tab, Box } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import "./HintBox.scss";

interface HintBoxProps {
  onClose: () => void;
  questionId: number;
  code: string;
  language: string;
}

const AI_HINT_SERVICE_URL = process.env.REACT_APP_AI_HINT_URL;

const HintBox: React.FC<HintBoxProps> = ({ onClose, questionId, code, language }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [hint, setHint] = useState<string>("");
  // const [complexity, setComplexity] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [modelAnswer, setModelAnswer] = useState<string>("");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        const hintResponse = await axios.get(`${AI_HINT_SERVICE_URL}/api/hint/${questionId}`);
        setHint(hintResponse.data.hint);

        const modelAnswerResponse = await axios.post(`${AI_HINT_SERVICE_URL}/api/ai_answer/`, {
          question_id: questionId,
          language: language,
        });
        setModelAnswer(modelAnswerResponse.data.ai_answer);

        const analysisResponse = await axios.post(`${AI_HINT_SERVICE_URL}/api/code-analysis/`, {
          code: code,
          language: language,
        });
        // setComplexity(analysisResponse.data.complexity);
        setAnalysis(analysisResponse.data.analysis);
      } catch (err) {
        setError("Failed to load AI hints. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [questionId, code, language]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderContent = (content: string) => {
    const sections = content.split(/(```[\s\S]*?```)/g); // Split by code blocks
    return sections.map((section, index) => {
      if (section.startsWith("```") && section.endsWith("```")) {
        // Strip backticks and render code with SyntaxHighlighter
        const code = section.slice(3, -3).trim();
        return (
          <SyntaxHighlighter key={index} language={language} style={materialDark}>
            {code}
          </SyntaxHighlighter>
        );
      }
      return (
        <Typography key={index} paragraph>
          {section}
        </Typography>
      );
    });
  };

  return (
    <div className="hintbox-expanded">
      <div className="hintbox-header">
        <Typography variant="h6">AI Hints</Typography>
        <Button onClick={onClose} className="hintbox-close-button">
          <CloseIcon />
        </Button>
      </div>
      <div className="hintbox-container">
        {loading ? (
          <div className="hintbox-loading">
            <CircularProgress />
          </div>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className="custom-tabs"
            >
              <Tab label="Hint" />
              <Tab label="Complexity Analysis" />
              <Tab label="Model Answer" />
            </Tabs>
            <Box p={2}>
              {activeTab === 0 && renderContent(hint)}
              {activeTab === 1 && (
                <>
                  {/* <Typography variant="subtitle1">Complexity: {complexity}</Typography> */}
                  {renderContent(analysis)}
                </>
              )}
              {activeTab === 2 && renderContent(modelAnswer)}
            </Box>
          </>
        )}
      </div>
    </div>
  );
};

export default HintBox;
