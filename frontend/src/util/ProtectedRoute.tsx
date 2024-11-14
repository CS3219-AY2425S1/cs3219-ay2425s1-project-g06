// components/ProtectedRoute.js
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios";
import { ReactElement } from "react";
import Spinner from "../components/Spinner/Spinner";
import { useMainDialog } from "../contexts/MainDialogContext";

interface ProtectedRouteProps {
  element: ReactElement;
  userId: string;
}

const ProtectedRoute = ({ element, userId }: ProtectedRouteProps): ReactElement => {
  const { roomNumber } = useParams();
  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRoomAccess = async () => {
      try {
        const body = { userId: userId, roomId: roomNumber };
        const response = await axios.post(`${process.env.REACT_APP_MATCHING_SERVICE_URL}/check`, {
          data: body,
        });
        setHasAccess(response.data.hasAccess);
      } catch (error) {
        console.error("Error checking room access:", error);
        setHasAccess(false);
      }
    };

    checkRoomAccess();
  }, [roomNumber, userId]);

  if (hasAccess === null) {
    return (
      <div style={{ height: "100vh" }}>
        <Spinner />
      </div>
    );
  }

  if (!hasAccess) {
    setMainDialogTitle("Access Denied");
    setMainDialogContent("It seems you do not have access. Please double check if you are in the correct room.");
    openMainDialog();
  }

  return hasAccess ? element : <Navigate to="/" />;
};

export default ProtectedRoute;
