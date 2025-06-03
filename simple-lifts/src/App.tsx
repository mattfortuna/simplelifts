// App.tsx
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import AuthContext from "./AuthContext";
import LoginPage from "./Login";
import PlanPage from "./PlanPage";

function App() {
  const [user, setUser] = useState<any>(null);

  const login = (user: any) => setUser(user);
  const logout = () => setUser(null);

  return (
    <div className="App">
      <AuthContext.Provider value={{ user, login, logout }}>
        {!user ? (
          <LoginPage />
        ) : (
          <PlanPage />)}
      </AuthContext.Provider>
    </div>
  );
}

export default App;
