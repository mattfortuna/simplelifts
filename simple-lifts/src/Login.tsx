import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Grow,
  Divider,
} from "@mui/material";
import AuthContext from "./AuthContext";

const mockUsers = [{ id: "1", username: "test", password: "test" }];

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const auth = useContext(AuthContext);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user && auth) {
        auth.login(user);
      }
    }
  }, []);

  const handleLogin = () => {
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      login(user);
    } else {
      alert("Invalid credentials");
    }
  };

  if (!auth) {
    return <Typography>Auth context not found</Typography>; // or redirect
  }
  
  const { login } = auth;

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f4f5",
      }}
    >
      <Grow in timeout={600}>
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 3,
            width: "100%",
            backgroundColor: "#ffffff",
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 900,
              fontFamily: "'Alfa Slab One', serif",
              color: "#333",
              letterSpacing: 1,
              mb: 1,
            }}
          >
            Simple Lifts
          </Typography>
          <Divider
            sx={{
              mb: 4,
              borderColor: "#a78bfa",
              borderBottomWidth: "2px",
              width: "60px",
              mx: "auto",
              borderRadius: 1,
            }}
          />

          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Username"
              variant="filled"
              fullWidth
              InputProps={{
                style: {
                  backgroundColor: "white",
                },
              }}
              InputLabelProps={{ style: { color: "#777" } }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              label="Password"
              variant="filled"
              type="password"
              fullWidth
              InputProps={{
                style: {
                  backgroundColor: "white",
                },
              }}
              InputLabelProps={{ style: { color: "#777" } }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleLogin}
              fullWidth
              size="large"
              sx={{
                mt: 2,
                py: 1.4,
                fontWeight: 600,
                backgroundColor: "#a78bfa",
                color: "#fff",
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "#8b74e6",
                },
              }}
            >
              Log In
            </Button>
          </Box>
        </Paper>
      </Grow>
    </Container>
  );
};

export default LoginPage;
