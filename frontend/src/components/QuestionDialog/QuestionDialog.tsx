import { Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { ReactElement, useEffect, useState } from "react";
import "./QuestionDialog.scss";
import { QuestionComplexity } from "../../models/question.model";
import { stringifyCategories } from "../../util/category.helper";
import QuestionService from "../../services/question.service";
import {
  QuestionValidationError,
  QuestionValidationMaxLength,
  QuestionValidationMinLength,
} from "../../util/question.helper";

const QuestionDialog = (props: {
  isAddNew: boolean;
  isOpen: boolean;
  id: number;
  title: string;
  description: string;
  categories: string[];
  complexity: QuestionComplexity;
  link: string;
  setIsOpen: (isOpen: boolean) => void;
  setId: (id: number) => void;
  setMainDialogTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setCategories: (categories: string[]) => void;
  setComplexity: (complexity: QuestionComplexity) => void;
  setLink: (link: string) => void;
  questionCallback: (question: any, action: string) => void;
}): ReactElement => {
  const {
    isAddNew,
    isOpen,
    id,
    title,
    description,
    categories,
    complexity,
    link,
    setIsOpen,
    setId,
    setMainDialogTitle,
    setDescription,
    setComplexity,
    setLink,
    questionCallback,
  } = props;

  const [categoriesString, setCategoriesString] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isErrorDisplayed, setIsErrorDisplayed] = useState<boolean>(false);

  useEffect(() => {
    setIsErrorDisplayed(false);
    setCategoriesString(stringifyCategories(categories));
  }, [categories]);

  const closeMainDialog = () => {
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    setIsErrorDisplayed(false);
    try {
      const response = isAddNew
        ? await QuestionService.addQuestion(id, title, description, categoriesString, complexity, link)
        : await QuestionService.editQuestion(id, title, description, categoriesString, complexity, link);
      questionCallback(response, isAddNew ? "added" : "updated");
      closeMainDialog();
    } catch (error: any) {
      if (error instanceof QuestionValidationError) {
        setError(error.message);
      } else if (error.response) {
        switch (error.response.status) {
          case 400:
            setError(`Question with questionId - ${id} already exists`);
            break;
          case 404:
            setError("Question not found");
            break;
          case 401:
            setError("Unauthorized - please log in");
            break;
          case 403:
            setError("Forbidden - you don't have permission");
            break;
          default:
            setError(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        setError("No response from server");
      } else {
        setError("Unknown Error Occured");
      }
      setIsErrorDisplayed(true);
    }
  };

  return (
    <Dialog className="QuestionDialog" open={isOpen}>
      <DialogTitle>
        <Typography className="QuestionDialog-title">{isAddNew ? "Add" : "Edit"} Question</Typography>
      </DialogTitle>

      <DialogContent className="QuestionDialog-content">
        <Box className="QuestionDialog-line">
          <TextField
            className="QuestionDialog-input QuestionDialog-input-id"
            slotProps={{
              htmlInput: {
                className: "QuestionDialog-input-text",
                maxLength: QuestionValidationMaxLength.id,
                minLength: QuestionValidationMinLength.id,
              },
              inputLabel: { className: "QuestionDialog-input-label" },
            }}
            disabled={!isAddNew}
            margin="dense"
            label="ID"
            type="text"
            value={id}
            onChange={(e) => setId(Number(e.target.value))}
          />
          <TextField
            className="QuestionDialog-input QuestionDialog-input-title"
            slotProps={{
              htmlInput: {
                className: "QuestionDialog-input-text",
                maxLength: QuestionValidationMaxLength.title,
                minLength: QuestionValidationMinLength.title,
              },
              inputLabel: { className: "QuestionDialog-input-label" },
            }}
            margin="dense"
            label="Title"
            type="text"
            value={title}
            onChange={(e) => setMainDialogTitle(e.target.value)}
          />
        </Box>

        <Box className="QuestionDialog-line">
          <FormControl className="QuestionDialog-input QuestionDialog-input-complexity" margin="dense">
            <InputLabel className="QuestionDialog-input-label">Complexity</InputLabel>
            <Select
              className="QuestionDialog-input-text"
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as QuestionComplexity)}
              label="Complexity"
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <TextField
            className="QuestionDialog-input QuestionDialog-input-categories"
            slotProps={{
              htmlInput: {
                className: "QuestionDialog-input-text",
                maxLength: QuestionValidationMaxLength.categories,
                minLength: QuestionValidationMinLength.categories,
              },
              inputLabel: { className: "QuestionDialog-input-label" },
            }}
            margin="dense"
            label="Categories (separated by semicolon)"
            type="text"
            value={categoriesString}
            onChange={(e) => setCategoriesString(e.target.value)}
          />
        </Box>

        <TextField
          className="QuestionDialog-input"
          slotProps={{
            htmlInput: {
              className: "QuestionDialog-input-text",
              maxLength: QuestionValidationMaxLength.description,
              minLength: QuestionValidationMinLength.description,
            },
            inputLabel: { className: "QuestionDialog-input-label" },
          }}
          margin="dense"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextField
          className="QuestionDialog-input"
          slotProps={{
            htmlInput: {
              className: "QuestionDialog-input-text",
              maxLength: QuestionValidationMaxLength.link,
              minLength: QuestionValidationMinLength.link,
            },
            inputLabel: {
              className: "QuestionDialog-input-label",
            },
          }}
          margin="dense"
          label="Link"
          type="text"
          fullWidth
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <Box className="QuestionDialog-error" hidden={!isErrorDisplayed}>
          <Chip color="error" className="QuestionDialog-error-text" label={error} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={closeMainDialog} color="secondary" variant="contained">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionDialog;
