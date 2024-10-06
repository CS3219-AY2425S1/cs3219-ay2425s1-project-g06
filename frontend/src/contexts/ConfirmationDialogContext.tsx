import { createContext, ReactNode, useContext, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog/ConfirmationDialog";
//import ConfirmationDialog from "../components/ConfirmationDialog/ConfirmationDialog";

interface ConfirmationDialogContextType {
  isOpen: boolean;
  title: string;
  content: string;
  openConfirmationDialog: () => void;
  closeConfirmationDialog: () => void;
  chooseConfirm: () => void;
  setConfirmationDialogTitle: (title: string) => void;
  setConfirmationDialogContent: (content: string) => void;
  setConfirmationCallBack: (confirmationCallback: () => void) => void;
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextType>({
  isOpen: false,
  title: "",
  content: "",
  openConfirmationDialog: () => {},
  closeConfirmationDialog: () => {},
  chooseConfirm: () => {},
  setConfirmationDialogTitle: () => {},
  setConfirmationDialogContent: () => {},
  setConfirmationCallBack: () => {},
});

export const ConfirmationDialogContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [title, setConfirmationDialogTitle] = useState<string>("");
  const [content, setConfirmationDialogContent] = useState<string>("");
  const [confirmationCallback, setConfirmationCallBack] = useState<() => void>(() => () => {});

  const openConfirmationDialog = () => {
    setIsOpen(true);
  };

  const closeConfirmationDialog = () => {
    setIsOpen(false);
  };

  const chooseConfirm = () => {
    confirmationCallback();
    closeConfirmationDialog();
  };

  return (
    <ConfirmationDialogContext.Provider
      value={{
        isOpen,
        title,
        content,
        openConfirmationDialog,
        closeConfirmationDialog,
        chooseConfirm,
        setConfirmationDialogTitle,
        setConfirmationDialogContent,
        setConfirmationCallBack,
      }}
    >
      <ConfirmationDialog />
      {children}
    </ConfirmationDialogContext.Provider>
  );
};

export const useConfirmationDialog = () => useContext(ConfirmationDialogContext);
