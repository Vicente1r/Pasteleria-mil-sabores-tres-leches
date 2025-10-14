import logo from './logo.svg';
import './App.css';
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import RouterConfig from "./routes/RouterConfig";
import { UserProvider } from './contexts/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <RouterConfg />
      </Router>
    </UserProvider>
  );
}

export default App;
