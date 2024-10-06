import { Button, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { ReactElement } from "react";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import "./ConfirmationDialog.scss";

const ConfirmationDialog = (): ReactElement => {
  const { isOpen, title, content, closeConfirmationDialog, chooseConfirm } = useConfirmationDialog();

  return (
    <Dialog className="ConfirmationDialog" open={isOpen} onClose={closeConfirmationDialog}>
      <DialogTitle>
        <Typography className="ConfirmationDialog-title">{title}</Typography>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          <Typography className="ConfirmationDialog-content">{content}</Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button color="secondary" variant="contained" onClick={closeConfirmationDialog}>
          Cancel
        </Button>
        <Button color="primary" variant="contained" onClick={chooseConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
