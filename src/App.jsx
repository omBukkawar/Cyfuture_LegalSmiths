import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage";
import Register from "./pages/register";
import Login from "./pages/login";
import Services from "./pages/services";
import Assistant from "./pages/legalAssistant";
import Prediction from "./pages/casePrediction";
import Analyzer from "./pages/contractAnalyzer";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<h1>Contact Page Coming Soon</h1>} />
      <Route path="/legalAssistant" element={<Assistant />} />
      <Route path="/casePrediction" element={<Prediction />} />
      <Route path="/contractAnalyzer" element={<Analyzer />} />
    </Routes>
  );
};

export default App;
