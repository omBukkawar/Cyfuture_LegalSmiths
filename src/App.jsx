import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage";
import Register from "./pages/register";
import Login from "./pages/login";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<h1>Services Page Coming Soon</h1>} />
      <Route path="/contact" element={<h1>Contact Page Coming Soon</h1>} />
    </Routes>
  );
};

export default App;
