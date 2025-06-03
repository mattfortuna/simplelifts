import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import moment from "moment";

// Define interfaces for workout structure
interface Workout {
  name: string;
  startingWeight: number;
}

interface LoggedWorkout {
  name: string;
  weight: number;
}

interface PlanDay {
  date: string;
  dayName: string;
  logs: LoggedWorkout[];
}

// Lifting days: Monday (1), Wednesday (3), Friday (5)
const liftingDaysOfWeek = [1, 3, 5];
const totalWeeks = 24;

// Rounds weight to nearest 5 for gym-friendly numbers
const roundToNearest5 = (weight: number) => Math.round(weight / 5) * 5;

// Applies a 5% increase and rounds the result
const increaseBy5Percent = (weight: number) => roundToNearest5(weight * 1.05);

// Load workouts from localStorage if available, otherwise use defaults
const defaultA = localStorage.getItem("workoutsA")
  ? JSON.parse(localStorage.getItem("workoutsA")!)
  : [
      { name: "Bench Press", startingWeight: 100 },
      { name: "Incline Dumbbell Press", startingWeight: 50 },
    ];

const defaultB = localStorage.getItem("workoutsB")
  ? JSON.parse(localStorage.getItem("workoutsB")!)
  : [
      { name: "Squat", startingWeight: 150 },
      { name: "Deadlift", startingWeight: 180 },
    ];

// Determine first lifting day from current week
const getStartingDate = () => {
  let date = moment().startOf("week").add(1, "days"); // Monday
  while (!liftingDaysOfWeek.includes(date.day())) {
    date = date.add(1, "day");
  }
  return date;
};

const getWeekPattern = (week: number) =>
  week % 2 === 0 ? ["A", "B", "A"] : ["B", "A", "B"];

// Generates weights for a single day by applying 5% progression for each prior week
const getWorkoutLogs = (dayWorkouts: Workout[], weekIndex: number): LoggedWorkout[] =>
  dayWorkouts.map((w) => {
    let weight = w.startingWeight;
    for (let i = 0; i < weekIndex; i++) {
      weight = increaseBy5Percent(weight);
    }
    return { name: w.name, weight };
  });

// Generate Plan Algorithm
const generateNewPlan = (
  workoutsA: Workout[],
  workoutsB: Workout[]
): Record<string, PlanDay> => {
  const newPlan: Record<string, PlanDay> = {};
  const startDate = getStartingDate();

  for (let week = 0; week < totalWeeks; week++) {
    const pattern = getWeekPattern(week); // e.g. ["A", "B", "A"]

    for (let i = 0; i < liftingDaysOfWeek.length; i++) {
      const dayOffset = (liftingDaysOfWeek[i] - startDate.day() + 7) % 7;
      const currentDate = startDate.clone().add(week * 7 + dayOffset, "days");
      const dateStr = currentDate.format("YYYY-MM-DD");
      const dayName = currentDate.format("ddd");

      const dayType = pattern[i]; // Either "A" or "B"
      const dayWorkouts = dayType === "A" ? workoutsA : workoutsB;

      newPlan[dateStr] = {
        date: dateStr,
        dayName,
        logs: getWorkoutLogs(dayWorkouts, week),
      };
    }
  }

  return newPlan;
};

// Adjusts all future workouts based on the log for a specific date
const updateFutureWorkouts = (
  plan: Record<string, PlanDay>,
  editDate: string,
  newLogs: LoggedWorkout[]
): Record<string, PlanDay> => {
  const newPlan = { ...plan };
  const oldLogs = newPlan[editDate].logs;

  const sortedDates = Object.keys(newPlan).sort(); // Ensure chronological order
  const editIndex = sortedDates.indexOf(editDate); // Find which day is being edited

  newLogs.forEach((newLog, idx) => {
    const oldWeight = oldLogs[idx]?.weight || 0;

    // If the user edited a weight, propagate change forward
    if (newLog.weight !== oldWeight) {
      for (let i = editIndex + 1; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const dayPlan = newPlan[date];
        const workoutIndex = dayPlan.logs.findIndex(
          (w) => w.name === newLog.name
        );

        if (workoutIndex !== -1) {
          const weeksAfter = Math.floor((i - editIndex) / 3); // Estimate weeks forward
          const updatedWeight = roundToNearest5(
            newLog.weight * Math.pow(1.05, weeksAfter)
          );
          newPlan[date].logs[workoutIndex].weight = updatedWeight;
        }
      }
    }
  });

  // Update the day that was edited with the new values
  newPlan[editDate] = {
    ...newPlan[editDate],
    logs: newLogs,
  };

  return newPlan;
};

// Main component
export default function WorkoutPlan() {
  const [workoutsA, setWorkoutsA] = useState<Workout[]>(defaultA);
  const [workoutsB, setWorkoutsB] = useState<Workout[]>(defaultB);
  const [plan, setPlan] = useState<Record<string, PlanDay>>(() =>
    localStorage.getItem("plan")
      ? JSON.parse(localStorage.getItem("plan")!)
      : {}
  );

  const [editDate, setEditDate] = useState<string | null>(null);
  const [editLogs, setEditLogs] = useState<LoggedWorkout[]>([]);

  // Persist workouts and plan to localStorage
  useEffect(() => {
    localStorage.setItem("workoutsA", JSON.stringify(workoutsA));
  }, [workoutsA]);

  useEffect(() => {
    localStorage.setItem("workoutsB", JSON.stringify(workoutsB));
  }, [workoutsB]);

  useEffect(() => {
    localStorage.setItem("plan", JSON.stringify(plan));
  }, [plan]);

  // Generates the full 24-week plan
  const generatePlan = () => {
    if (workoutsA.length === 0 && workoutsB.length === 0) return;
    const newPlan = generateNewPlan(workoutsA, workoutsB);
    setPlan(newPlan);
  };

  // Opens dialog to edit workout on a specific date
  const openEdit = (date: string) => {
    setEditDate(date);
    setEditLogs(plan[date].logs.map((w) => ({ ...w }))); // Deep copy
  };

  // Updates local weight edit
  const handleWeightChange = (idx: number, val: string) => {
    let weight = parseInt(val);
    if (isNaN(weight) || weight < 0) weight = 0;
    setEditLogs((logs) => {
      const newLogs = [...logs];
      newLogs[idx].weight = weight;
      return newLogs;
    });
  };

  // Saves edited log and updates future progression accordingly
  const handleSaveLog = () => {
    if (!editDate) return;
    setPlan((prevPlan) => updateFutureWorkouts(prevPlan, editDate, editLogs));
    setEditDate(null);
  };

  // For UI highlighting
  const todayStr = moment().format("YYYY-MM-DD");
  const sortedPlanDates = Object.keys(plan).sort();
  const nextWorkoutDate = sortedPlanDates.find((date) => date >= todayStr);

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 900, margin: "auto" }}>
      {/* A/B Workout Setup */}
      <Stack direction="row" spacing={4} justifyContent="center">
        {[{ label: "A", workouts: workoutsA, setWorkouts: setWorkoutsA }, { label: "B", workouts: workoutsB, setWorkouts: setWorkoutsB }].map(
          ({ label, workouts, setWorkouts }) => (
            <Stack key={label} spacing={1} sx={{ width: 1 / 2 }}>
              <Typography variant="h6" textAlign="center">
                {label} Day Workouts
              </Typography>
              {workouts.map((w, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <TextField
                    label="Lift"
                    variant="outlined"
                    size="small"
                    value={w.name}
                    onChange={(e) => {
                      const copy = [...workouts];
                      copy[i] = { ...copy[i], name: e.target.value };
                      setWorkouts(copy);
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <TextField
                    label="Weight"
                    variant="outlined"
                    size="small"
                    type="number"
                    value={w.startingWeight}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 0;
                      const copy = [...workouts];
                      copy[i] = { ...copy[i], startingWeight: val };
                      setWorkouts(copy);
                    }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    color="error"
                    onClick={() => setWorkouts(workouts.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Button
                variant="outlined"
                onClick={() => setWorkouts([...workouts, { name: "", startingWeight: 0 }])}
              >
                Add {label} Day Workout
              </Button>
            </Stack>
          )
        )}
      </Stack>

      <Divider />

      <Button variant="contained" onClick={generatePlan}>
        Get My Plan
      </Button>

      <Divider />

      <Typography variant="h5" textAlign="center">
        Your Plan
      </Typography>

      {/* Workout Plan Cards */}
      <Stack spacing={2}>
        {Object.entries(plan)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, day]) => {
            const isNextWorkout = date === nextWorkoutDate;
            return (
              <Box
                key={date}
                sx={{
                  p: 2,
                  border: isNextWorkout ? "5px solid" : "1px solid",
                  borderColor: isNextWorkout ? "#a78bfa" : "grey.300",
                  borderRadius: 2,
                  boxShadow: isNextWorkout ? 3 : 1,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">
                    {day.dayName} — {moment(date).format("MMM D, YYYY")}
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => openEdit(date)}>
                    Log / Edit
                  </Button>
                </Stack>
                <Divider sx={{ my: 2 }} />
                {day.logs.length === 0 && <Typography>No workouts</Typography>}
                {day.logs.map(({ name, weight }) => (
                  <React.Fragment key={name}>
                    <Stack direction="row">
                      <Typography>{name}:</Typography>
                      <Typography sx={{ ml: 1 }}>{weight} lbs</Typography>
                    </Stack>
                    <Divider sx={{ my: 2, width: "9%" }} />
                  </React.Fragment>
                ))}
              </Box>
            );
          })}
      </Stack>

      {/* Edit Workout Dialog */}
      <Dialog open={!!editDate} onClose={() => setEditDate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Workout Log for {editDate}</DialogTitle>
        <DialogContent>
          {editLogs.map((log, i) => (
            <Stack key={log.name} direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ flexGrow: 1 }}>{log.name}</Typography>
              <TextField
                label="Weight"
                type="number"
                value={log.weight}
                onChange={(e) => handleWeightChange(i, e.target.value)}
                sx={{ width: 100 }}
              />
              <Typography>lbs</Typography>
            </Stack>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDate(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveLog}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
