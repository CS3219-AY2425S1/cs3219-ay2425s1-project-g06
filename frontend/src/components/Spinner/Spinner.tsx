import { ReactElement } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import "./Spinner.scss";
import { Typography } from "@mui/material";

const Spinner = (): ReactElement => {
  return (
    <div className="Spinner">
      <CircularProgress className="Spinner-progress" color="primary" thickness={5} />
      <Typography className="Spinner-text" variant="h5">
        Loading...
      </Typography>
    </div>
  );
};

export default Spinner;
