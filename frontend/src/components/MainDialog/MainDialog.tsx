import { Button, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { ReactElement } from "react";
import { useMainDialog } from "../../contexts/MainDialogContext";
import "./MainDialog.scss";

const MainDialog = (): ReactElement => {
  const { isOpen, title, content, closeMainDialog } = useMainDialog();

  return (
    <Dialog className="MainDialog" open={isOpen} onClose={closeMainDialog}>
      <DialogTitle>
        <Typography className="MainDialog-title">{title}</Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          <Typography className="MainDialog-content">{content}</Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button color="primary" variant="contained" onClick={closeMainDialog}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MainDialog;
