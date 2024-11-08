import "./App.scss";
import "@fontsource/lexend";
import { ReactElement, useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import SignUp from "./pages/SignUp/SignUp";
import Login from "./pages/Login/Login";
import AccountSettings from "./pages/AccountSettings/AccountSettings";
import { createTheme, ThemeProvider } from "@mui/material";
import { MainDialogContextProvider } from "./contexts/MainDialogContext";
import { ConfirmationDialogContextProvider } from "./contexts/ConfirmationDialogContext";
import { UserContext } from "./contexts/UserContext";
import Questions from "./pages/Questions/Questions";
import Interview from "./pages/Interview/Interview";
import { SessionContextProvider } from "./contexts/SessionContext";
import VideoChat from "./pages/Communication/Commincation";
import CodeEditor from "./pages/CodeEditor/CodeEditor";
import ProtectedRoute from "./util/ProtectedRoute";
import History from "./pages/History/History";
import CodeViewer from "./pages/CodeViewer/CodeViewer";

const theme = createTheme({
  typography: {
    fontFamily: ["Lexend", "Roboto", "Arial"].join(","),
  },
  palette: {
    primary: {
      main: "#caff33",
    },
    secondary: {
      main: "#ffffff00",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "82px",
          fontSize: "1rem",
          fontWeight: 400,
          textTransform: "none",
          "&.Mui-disabled": {
            backgroundColor: "lightgray",
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#ffffff",
        },
        body2: {
          color: "#caff33",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          minWidth: "40vw",
          borderRadius: "10px",
          background: "#1c1c1c",
          padding: "20px 20px",
        },
      },
    },
  },
});

const App = (): ReactElement => {
  const { user } = useContext(UserContext);

  return (
    <ThemeProvider theme={theme}>
      <MainDialogContextProvider>
        <ConfirmationDialogContextProvider>
          <SessionContextProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={user ? <Navigate to={"/"} /> : <SignUp />} />
              <Route path="/login" element={user ? <Navigate to={"/"} /> : <Login />} />
              <Route path="/settings" element={user ? <AccountSettings /> : <Navigate to={"/login"} />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/interview" element={user ? <Interview /> : <Navigate to={"/"} />} />
              <Route path="/history" element={user ? <History /> : <Navigate to={"/"} />} />
              <Route path="/video" element={<VideoChat />} />
              <Route path="/view" element={<CodeViewer />} />
              <Route
                path="/code-editor/:roomNumber"
                element={
                  user ? (
                    <ProtectedRoute element={<CodeEditor />} userId={user.id as string} />
                  ) : (
                    <Navigate to={"/login"} />
                  )
                }
              />
            </Routes>
          </SessionContextProvider>
        </ConfirmationDialogContextProvider>
      </MainDialogContextProvider>
    </ThemeProvider>
  );
};

export default App;
