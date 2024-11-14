import { createContext, ReactNode, useContext, useState } from "react";
import MainDialog from "../components/MainDialog/MainDialog";

interface MainDialogContextType {
  isOpen: boolean;
  title: string;
  content: string;
  openMainDialog: () => void;
  closeMainDialog: () => void;
  setMainDialogTitle: (title: string) => void;
  setMainDialogContent: (content: string) => void;
}

const MainDialogContext = createContext<MainDialogContextType>({
  isOpen: false,
  title: "",
  content: "",
  openMainDialog: () => {},
  closeMainDialog: () => {},
  setMainDialogTitle: () => {},
  setMainDialogContent: () => {},
});

export const MainDialogContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [title, setMainDialogTitle] = useState<string>("");
  const [content, setMainDialogContent] = useState<string>("");

  const openMainDialog = () => {
    setIsOpen(true);
  };

  const closeMainDialog = () => {
    setIsOpen(false);
  };

  return (
    <MainDialogContext.Provider
      value={{ isOpen, title, content, openMainDialog, closeMainDialog, setMainDialogTitle, setMainDialogContent }}
    >
      <MainDialog></MainDialog>
      {children}
    </MainDialogContext.Provider>
  );
};

export const useMainDialog = () => useContext(MainDialogContext);
