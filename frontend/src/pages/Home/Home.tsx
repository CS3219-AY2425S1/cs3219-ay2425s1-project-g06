import { ReactElement } from "react";
import "./Home.scss";
import Navbar from "../../components/Navbar/Navbar";
import { Box, Typography } from "@mui/material";
import CodeEditorImage from "../../assets/code_editor.svg";
import Footer from "../../components/Footer/Footer";
import RecentSessions from "../../components/RecentSessions/RecentSessions";

const Home = (): ReactElement => {
  return (
    <Box className="Home">
      <Navbar />
      <Box className="Home-welcome">
        <Box className="Home-welcome-text">
          <Typography className="Home-welcome-title">
            Welcome to LuckyJinx <br /> Empowering Your{" "}
          </Typography>
          <Typography variant="body2" className="Home-welcome-title">
            Interview Preparation
          </Typography>
          <Typography className="Home-welcome-description">
            Collaborate with other enthusiastic coders to prepare for your technical interviews! <br />
            Select a difficulty level and a topic, and we will immediately select a question and match you with another
            coder. You can then start on developing a solution to the problem.
          </Typography>
          {/* <Button color="primary" variant="contained">
            Get Started
          </Button> */}
        </Box>
        <Box className="Home-welcome-recent">
          <Box className="Home-welcome-recent-sessions">
            <RecentSessions />
          </Box>
          <Box className="Home-welcome-recent-image">
            <img className="Home-welcome-image" src={CodeEditorImage} alt="Code Editor" />
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default Home;
