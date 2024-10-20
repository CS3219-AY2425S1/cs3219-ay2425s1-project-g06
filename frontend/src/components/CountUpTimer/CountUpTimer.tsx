import { Box, Typography } from "@mui/material";
import { ReactElement, useContext, useEffect, useState } from "react";
import { SessionContext, SessionState } from "../../contexts/SessionContext";

const getTotalMatchingTimeSeconds = (cumulativeMatchingTime: number, lastMatchingStartTime: number): number => {
  const currentTime = Date.now();
  return Math.floor((cumulativeMatchingTime + currentTime - lastMatchingStartTime) / 1000);
};

// const MATCH_INTERVAL_SECONDS = 30;

// const getTotalMatchingTimeSeconds = (matchCount: number, lastMatchingStartTime: number): number => {
//   console.log("last:", lastMatchingStartTime);
//   const currentTime = Date.now();
//   return MATCH_INTERVAL_SECONDS * matchCount + Math.floor((currentTime - lastMatchingStartTime) / 1000);
// };

const CountUpTimer = (): ReactElement => {
  // const { sessionState, cumulativeMatchingTime, lastMatchingStartTime } = useContext(SessionContext);
  const { sessionState, cumulativeMatchingTime, lastMatchingStartTime } = useContext(SessionContext);

  const [time, setTime] = useState<number>(getTotalMatchingTimeSeconds(cumulativeMatchingTime, lastMatchingStartTime));
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionState !== SessionState.TIMEOUT) {
        setTime(getTotalMatchingTimeSeconds(cumulativeMatchingTime, lastMatchingStartTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState, time, cumulativeMatchingTime, lastMatchingStartTime]);

  return (
    <Box>
      <Typography variant="h4">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </Typography>
    </Box>
  );
};

export default CountUpTimer;
