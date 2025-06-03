import React, { useState, useEffect, useContext } from "react";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import AuthContext from "./AuthContext";
import CreateWorkoutPlan from "./CreatePlan";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Container,
  Stack,
} from "@mui/material";

const mockStorage: Record<string, any> = {};

const PlanPage = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const auth = useContext(AuthContext);
  const { user } = auth || {};

  useEffect(() => {
    if (mockStorage[user.id]) {
      const { workouts, plan, history } = mockStorage[user.id];
      setWorkouts(workouts || []);
      setPlan(plan || []);
      setHistory(history || []);
    }
  }, [user.id]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.reload();
  }
  if (!auth) return null;

  return (
    <Container
      maxWidth="md"
      sx={{
        backgroundColor: "#fff",
        color: "#222",
        padding: 4,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" mb={4}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "black", fontFamily: "'Alfa Slab One', serif", }}>
        Simple Lifts
      </Typography>

      <Button
        onClick={handleLogout}
        variant="outlined"
      >
        Logout
      </Button>
      </Stack>

      <CreateWorkoutPlan></CreateWorkoutPlan>

      <List>
        {plan.map((w) => (
          <Paper
            key={w.id}
            sx={{
              backgroundColor: "#fafafa",
              color: "#222",
              mb: 2,
              padding: 2,
              borderLeft: "4px solid #ce93d8",
            }}
            elevation={2}
          >
          </Paper>
        ))}
      </List>
    </Container>
  );
};

export default PlanPage;
