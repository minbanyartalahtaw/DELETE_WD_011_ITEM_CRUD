//src/Login.jsx

import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggedIn, isLogInError, loginErrorMsg, isInitializing } =
    useContext(UserContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn]);

  if (isInitializing) return <></>;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/");
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 8, px: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Login
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {isLogInError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {loginErrorMsg}
          </Alert>
        )}

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </form>
    </Box>
  );
}
