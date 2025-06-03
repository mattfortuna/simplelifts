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

const liftingDaysOfWeek = [1, 3, 5]; // Monday, Wednesday, Friday (0=Sun)
const totalWeeks = 24;

const roundToNearest5 = (weight: number) => Math.round(weight / 5) * 5;

const increaseBy5Percent = (weight: number) =>
  roundToNearest5(weight * 1.05);

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

export default function WorkoutPlan() {
  const [workoutsA, setWorkoutsA] = useState<Workout[]>(defaultA);
  const [workoutsB, setWorkoutsB] = useState<Workout[]>(defaultB);

  const currPlan = localStorage.getItem("plan")
    ? JSON.parse(localStorage.getItem("plan")!)
    : {};

  const [plan, setPlan] = useState<Record<string, PlanDay>>(currPlan);

  useEffect(() => {
    const savedWorkoutsA = localStorage.getItem("workoutsA");
    const savedWorkoutsB = localStorage.getItem("workoutsB");

    if (savedWorkoutsA) setWorkoutsA(JSON.parse(savedWorkoutsA));
    if (savedWorkoutsB) setWorkoutsB(JSON.parse(savedWorkoutsB));
  }, []);

  useEffect(() => {
    localStorage.setItem("workoutsA", JSON.stringify(workoutsA));
  }, [workoutsA]);

  useEffect(() => {
    localStorage.setItem("workoutsB", JSON.stringify(workoutsB));
  }, [workoutsB]);

  const [editDate, setEditDate] = useState<string | null>(null);
  const [editLogs, setEditLogs] = useState<LoggedWorkout[]>([]);

  useEffect(() => {
    localStorage.setItem("plan", JSON.stringify(plan));
  }, [plan]);

  // Generate workout days: ABA Week 1, BAB Week 2, etc.
  // Monday (1), Wednesday(3), Friday(5)
  const generatePlan = () => {
    if (workoutsA.length === 0 && workoutsB.length === 0) return;

    const newPlan: Record<string, PlanDay> = {};
    let startDate = moment().startOf("week").add(1, "days"); // Monday this week

    // Next lifting day on or after today
    while (!liftingDaysOfWeek.includes(startDate.day())) {
      startDate = startDate.add(1, "day");
    }

    for (let week = 0; week < totalWeeks; week++) {
      // Week pattern ABA or BAB
      const pattern = week % 2 === 0 ? ["A", "B", "A"] : ["B", "A", "B"];

      for (let i = 0; i < liftingDaysOfWeek.length; i++) {
        const dayOffset = (liftingDaysOfWeek[i] - startDate.day() + 7) % 7;
        const currentDate = startDate.clone().add(week * 7 + dayOffset, "days");
        const dateStr = currentDate.format("YYYY-MM-DD");
        const dayName = currentDate.format("ddd");

        // Workouts for the day
        const dayType = pattern[i];
        const dayWorkouts = dayType === "A" ? workoutsA : workoutsB;

        // Week index for increases (full weeks from startDate)
        const weekIndex = week;

        const logs = dayWorkouts.map((w) => {
          let weight = w.startingWeight;
          // Increase by 5% each week
          for (let inc = 0; inc < weekIndex; inc++) {
            weight = increaseBy5Percent(weight);
          }
          return { name: w.name, weight };
        });

        newPlan[dateStr] = { date: dateStr, dayName, logs };
      }
    }

    setPlan(newPlan);
  };

  const openEdit = (date: string) => {
    setEditDate(date);
    setEditLogs(plan[date].logs.map((w) => ({ ...w }))); // copy to local state
  };

  // Handle weight change
  const handleWeightChange = (idx: number, val: string) => {
    let weight = parseInt(val);
    if (isNaN(weight) || weight < 0) weight = 0;
    setEditLogs((logs) => {
      const newLogs = [...logs];
      newLogs[idx].weight = weight;
      return newLogs;
    });
  };

  // Save edited logs and update future weights based on changes
  const handleSaveLog = () => {
    if (!editDate) return;

    setPlan((prevPlan) => {
      const newPlan = { ...prevPlan };
      const oldLogs = newPlan[editDate].logs;
      const newLogs = editLogs;

      // Save logs for the edited day
      newPlan[editDate] = {
        ...newPlan[editDate],
        logs: newLogs,
      };

      // Sort dates
      const sortedDates = Object.keys(newPlan).sort();
      const editIndex = sortedDates.indexOf(editDate);

      newLogs.forEach((newLog, idx) => {
        const oldWeight = oldLogs[idx]?.weight || 0;
        if (newLog.weight !== oldWeight) {
          // Update all future dates for this workout
          for (let i = editIndex + 1; i < sortedDates.length; i++) {
            const date = sortedDates[i];
            const dayPlan = newPlan[date];
            const workoutIndex = dayPlan.logs.findIndex(
              (w) => w.name === newLog.name
            );
            if (workoutIndex !== -1) {
              // weeksAfter counts how many weeks have passed since editDate (3 lifting days per week)
              const weeksAfter = Math.floor((i - editIndex) / 3);
              const updatedWeight = roundToNearest5(
                newLog.weight * Math.pow(1.05, weeksAfter)
              );
              newPlan[date].logs[workoutIndex].weight = updatedWeight;
            }
          }
        }
      });

      return newPlan;
    });

    setEditDate(null);
  };

  // Next workout date
  const todayStr = moment().format("YYYY-MM-DD");
  const sortedPlanDates = Object.keys(plan).sort();
  const nextWorkoutDate = sortedPlanDates.find((date) => date >= todayStr);

  return (
    <Stack spacing={3} sx={{ p: 3, maxWidth: 900, margin: "auto" }}>
      <Stack direction="row" spacing={4} justifyContent="center">
        <Stack spacing={1} sx={{ width: 1 / 2 }}>
          <Typography variant="h6" textAlign="center">
            A Day Workouts
          </Typography>
          {workoutsA.map((w, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <TextField
                label="Lift"
                variant="outlined"
                size="small"
                value={w.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setWorkoutsA((ws) => {
                    const copy = [...ws];
                    copy[i] = { ...copy[i], name: val };
                    return copy;
                  });
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
                  setWorkoutsA((ws) => {
                    const copy = [...ws];
                    copy[i] = { ...copy[i], startingWeight: val };
                    return copy;
                  });
                }}
                sx={{ width: 120 }}
              />
              <Button
                color="error"
                onClick={() =>
                  setWorkoutsA((ws) => ws.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </Button>
            </Stack>
          ))}
          <Button
            variant="outlined"
            onClick={() =>
              setWorkoutsA((ws) => [...ws, { name: "", startingWeight: 0 }])
            }
          >
            Add A Day Workout
          </Button>
        </Stack>

        <Stack spacing={1} sx={{ width: 1 / 2 }}>
          <Typography variant="h6" textAlign="center">
            B Day Workouts
          </Typography>
          {workoutsB.map((w, i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <TextField
                label="Lift"
                variant="outlined"
                size="small"
                value={w.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setWorkoutsB((ws) => {
                    const copy = [...ws];
                    copy[i] = { ...copy[i], name: val };
                    return copy;
                  });
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
                  setWorkoutsB((ws) => {
                    const copy = [...ws];
                    copy[i] = { ...copy[i], startingWeight: val };
                    return copy;
                  });
                }}
                sx={{ width: 200 }}
              />
              <Button
                color="error"
                onClick={() =>
                  setWorkoutsB((ws) => ws.filter((_, idx) => idx !== i))
                }
              >
                Remove
              </Button>
            </Stack>
          ))}
          <Button
            variant="outlined"
            onClick={() =>
              setWorkoutsB((ws) => [...ws, { name: "", startingWeight: 0 }])
            }
          >
            Add B Day Workout
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Button variant="contained" onClick={generatePlan}>
        Get My Plan
      </Button>

      <Divider />

      <Typography variant="h5" textAlign="center">
        Workout Plan
      </Typography>

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
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="h6">
                    {day.dayName} — {moment(date).format("MMM D, YYYY")}
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => openEdit(date)}>
                    Log / Edit
                  </Button>
                </Stack>
                <Divider sx={{ my: 2}} />
                {day.logs.length === 0 && <Typography>No workouts</Typography>}
                {day.logs.map(({ name, weight }) => (
                    <>
                  <Stack
                    direction={"row"}
                  >
                    <Typography key={name}>
                        {name}:
                    </Typography>
                    <Typography sx={{ float: "right", ml: 1 }}>
                        {weight} lbs
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 2, width: "9%"}} />
                  </>
                ))}
              </Box>
            );
          })}
      </Stack>

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
