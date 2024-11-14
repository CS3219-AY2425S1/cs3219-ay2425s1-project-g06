import { ReactElement, useContext, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
} from "@mui/material";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./AccountSettings.scss";
import { UserContext } from "../../contexts/UserContext";
import { JWT_TOKEN_KEY } from "../../util/constants";
import UserService from "../../services/user.service";
import { useConfirmationDialog } from "../../contexts/ConfirmationDialogContext";
import { useNavigate } from "react-router-dom";
import { SupportedProgrammingLanguages } from "../../constants/supported_programming_languages";
import { useMainDialog } from "../../contexts/MainDialogContext";
import {
  mapUserResponseToUserProfile,
  UserValidationErrors,
  validateAvatar,
  validateEmail,
  validateName,
} from "../../util/user.helper";

const AccountSettings = (): ReactElement => {
  const { user, setUser } = useContext(UserContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<UserValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [displayedName, setDisplayedName] = useState(user?.username?.toString() ?? "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.avatar?.toString() ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    (user?.language?.toString() as SupportedProgrammingLanguages) ?? SupportedProgrammingLanguages.python,
  );
  const [email, setEmail] = useState(user?.email?.toString() ?? "");
  // const [password, setPassword] = useState("password");

  const { setMainDialogTitle, setMainDialogContent, openMainDialog } = useMainDialog();
  const { setConfirmationDialogTitle, setConfirmationDialogContent, setConfirmationCallBack, openConfirmationDialog } =
    useConfirmationDialog();

  const navigate = useNavigate();

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    setConfirmationMessage(null);

    try {
      const errors: UserValidationErrors = {
        name: validateName(displayedName),
        email: validateEmail(email),
        avatar: validateAvatar(profilePhotoUrl),
      };

      setFieldErrors(errors);

      if (errors.name || errors.email || errors.avatar) {
        return;
      }

      const response = await UserService.updateAccount(
        user!.id.toString(),
        displayedName,
        email,
        null,
        // password,
        profilePhotoUrl,
        preferredLanguage as SupportedProgrammingLanguages,
      );

      if (response instanceof Error) {
        setError(response.message || "An unexpected error occurred");
      } else {
        setUser(mapUserResponseToUserProfile(response));
        setConfirmationMessage("Account details saved successfully!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
    setUser(null);
    navigate("/");
  };

  const openLogoutConfirmationDialog = () => {
    setConfirmationDialogTitle("Log out");
    setConfirmationDialogContent("Are you sure you want to log out?");
    setConfirmationCallBack(() => logout);
    openConfirmationDialog();
  };

  const openDeleteAccountConfirmationDialog = () => {
    if (user?.id) {
      setConfirmationDialogTitle("Delete account");
      setConfirmationDialogContent("Are you sure you want to delete your account? This action cannot be undone.");
      setConfirmationCallBack(() => async () => {
        const response = await UserService.deleteAccount(user.id);
        if (response instanceof Error) {
          setMainDialogTitle("Error when deleting account");
          setMainDialogContent(response.message || "An unexpected error occurred");
          openMainDialog();
        } else {
          logout();
        }
      });
      openConfirmationDialog();
    }
  };

  return (
    <Box className="AccountSettings">
      <Navbar />
      <Box className="AccountSettings-container">
        <Box className="AccountSettings-header">
          <Typography variant="body2" className="AccountSettings-title">
            Account Settings
          </Typography>
          <Typography className="AccountSettings-subtitle">Customize your information and experience here!</Typography>
        </Box>
        <form
          className="AccountSettings-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveChanges();
          }}
        >
          <Box className="AccountSettings-row">
            <Typography className="AccountSettings-label-name" variant="body1">
              Displayed Name (to others)
            </Typography>
            <TextField
              variant="outlined"
              placeholder="Enter your name"
              className="AccountSettings-input"
              fullWidth
              value={displayedName}
              onChange={(e) => setDisplayedName(e.target.value)}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
            />
          </Box>

          <Box className="AccountSettings-row">
            <Typography className="AccountSettings-label-avatar" variant="body1">
              Profile Photo
            </Typography>
            <Box className="AccountSettings-photo-section">
              <img src={profilePhotoUrl} alt="Profile" className="AccountSettings-profile-photo" />
              <TextField
                variant="outlined"
                placeholder="Enter new URL to change"
                className="AccountSettings-input"
                fullWidth
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
                error={!!fieldErrors.avatar}
                helperText={fieldErrors.avatar}
              />
            </Box>
          </Box>

          <Box className="AccountSettings-row">
            <Typography className="AccountSettings-label-language" variant="body1">
              Preferred Programming Language
            </Typography>
            <Select
              className="AccountSettings-select"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as SupportedProgrammingLanguages)}
              fullWidth
              inputProps={{
                classes: {
                  icon: "AccountSettings-select-icon",
                },
              }}
            >
              {Object.values(SupportedProgrammingLanguages).map((language) => {
                return (
                  <MenuItem key={language} value={language}>
                    {language}
                  </MenuItem>
                );
              })}
            </Select>
          </Box>

          <Box className="AccountSettings-row">
            <Typography className="AccountSettings-label-email" variant="body1">
              Email
            </Typography>
            <TextField
              variant="outlined"
              className="AccountSettings-input"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {confirmationMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {confirmationMessage}
            </Alert>
          )}

          <Box className="AccountSettings-buttons">
            <Button
              color="primary"
              variant="contained"
              className="AccountSettings-buttons-save"
              onClick={handleSaveChanges}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Save Changes"}
            </Button>

            <Box className="AccountSettings-buttons-logout-section">
              <Button
                color="primary"
                variant="contained"
                className="AccountSettings-buttons-logout"
                onClick={openLogoutConfirmationDialog}
                disabled={loading}
              >
                {"Log out"}
              </Button>
              <Button
                color="error"
                variant="contained"
                className="AccountSettings-buttons-delete-account"
                onClick={openDeleteAccountConfirmationDialog}
                disabled={loading}
              >
                {"Delete account"}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
      <Footer />
    </Box>
  );
};

export default AccountSettings;
