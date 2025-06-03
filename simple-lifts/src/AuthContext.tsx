import React from "react";

interface AuthContextType {
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export default AuthContext;
