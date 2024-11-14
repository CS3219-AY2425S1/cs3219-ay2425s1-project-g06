import { Box } from "@mui/material";
import { ReactElement } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import QuestionList from "../../components/QuestionList/QuestionList";
import "./Questions.scss";

const Questions = (): ReactElement => {
  return (
    <Box className="Questions">
      <Navbar />
      <QuestionList />
      <Footer />
    </Box>
  );
};

export default Questions;
