import { Box, Button, FormControlLabel, MenuItem, Radio, RadioGroup, Select, Typography } from "@mui/material";
import { ReactElement, useState } from "react";
import { Categories, QuestionComplexity } from "../../models/question.model";
import "./MatchingForm.scss";

// const MAX_TOPIC_COUNT = 5;
// const MIN_TOPIC_COUNT = 1;

const MatchingForm = (props: { startMatchingCallBack: any }): ReactElement => {
  const { startMatchingCallBack } = props;

  const [topic, setTopic] = useState<Categories>(Categories.ALGORITHMS);
  const [difficulty, setDifficulty] = useState<QuestionComplexity>("Easy");

  const submitForm = () => {
    startMatchingCallBack(topic, difficulty);
  };

  return (
    <Box className="Interview-form">
      <Typography className="Interview-form-title">Select Topic & Difficulty</Typography>
      <Typography className="Interview-form-description" textAlign="center">
        {/* Choose at least 1, at most {MAX_TOPIC_COUNT} topics to get started. Choosing more than one topic increases the
        chances of matching and reduces the waiting time. */}
        Choose your desired topic and difficulty. We will match you with a partner who has similar preferences.
      </Typography>
      <Typography className="Interview-form-label">Topic</Typography>
      <Select
        className="Interview-form-topic-select"
        value={topic}
        autoWidth
        onChange={(e) => setTopic(e.target.value as Categories)}
        inputProps={{
          classes: {
            icon: "AccountSettings-select-icon",
          },
        }}
        MenuProps={{
          sx: {
            "&& .Mui-selected": {
              background: "#d4ff50",
            },
          },
        }}
      >
        {Object.values(Categories).map((category) => {
          return (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          );
        })}
      </Select>
      <Typography className="Interview-form-label">Difficulty</Typography>

      <RadioGroup
        className="Interview-form-difficulty-select"
        defaultValue="Easy"
        onChange={(e) => {
          setDifficulty(e.target.value as QuestionComplexity);
        }}
        row
      >
        <FormControlLabel
          value="Easy"
          control={<Radio className="Interview-form-difficulty-select-radio" />}
          label="Easy"
        />
        <FormControlLabel
          value="Medium"
          control={<Radio className="Interview-form-difficulty-select-radio" />}
          label="Medium"
        />
        <FormControlLabel
          value="Hard"
          control={<Radio className="Interview-form-difficulty-select-radio" />}
          label="Hard"
        />
      </RadioGroup>

      <Button className="Interview-form-button-submit" color="primary" variant="contained" onClick={submitForm}>
        Proceed
      </Button>
    </Box>
  );
};

export default MatchingForm;
