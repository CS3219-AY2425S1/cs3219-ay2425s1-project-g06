import { Button, Chip, Typography } from "@mui/material";
import { ReactElement, useContext } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Question } from "../../models/question.model";
import Spinner from "../Spinner/Spinner";
import "./QuestionContainer.scss";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import { SessionContext } from "../../contexts/SessionContext";
import { useNavigate } from "react-router-dom";

const QuestionContainer = (props: { questionData: Question | null }): ReactElement => {
  const { questionData } = props;
  const { setConfirmationDialogTitle, setConfirmationDialogContent, setConfirmationCallBack, openConfirmationDialog } =
    useConfirmationDialog();
  const { clearSession } = useContext(SessionContext);
  const navigate = useNavigate();

  return (
    <div>
      {questionData ? (
        <div className="question-container">
          <div className="question-header">
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

          <div>
            <Button
              variant="outlined"
              color="error"
              className="leave-button"
              onClick={() => {
                setConfirmationDialogTitle("Leave Session");
                setConfirmationDialogContent(
                  "Are you sure you want to leave the session?\nYou will be able to rejoin if your partner is still in the session.",
                );
                setConfirmationCallBack(() => () => {
                  clearSession();
                  navigate("/");
                });
                openConfirmationDialog();
              }}
            >
              Leave Session
            </Button>
          </div>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
};

export default QuestionContainer;
