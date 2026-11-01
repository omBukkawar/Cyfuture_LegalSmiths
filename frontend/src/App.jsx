import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage";
import Register from "./pages/register";
import Login from "./pages/login";
import Services from "./pages/services";
import Assistant from "./pages/legalAssistant";
import Prediction from "./pages/casePrediction";
import Analyzer from "./pages/contractAnalyzer";
import Contact from "./pages/contact";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/contact" element={<Contact />} />

      {/* Protected Legal Service Routes */}
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        }
      />
      <Route
        path="/legalAssistant"
        element={
          <ProtectedRoute>
            <Assistant />
          </ProtectedRoute>
        }
      />
      <Route
        path="/casePrediction"
        element={
          <ProtectedRoute>
            <Prediction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractAnalyzer"
        element={
          <ProtectedRoute>
            <Analyzer />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
