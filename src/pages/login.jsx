import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../styles/auth.css";

const Login = () => {
  // State for form inputs
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  // Handle input changes dynamically
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send login request to backend
      const res = await axios.post("http://localhost:5000/login", {
        email: formData.email,
        password: formData.password,
      });

      alert(res.data.message);

      // If login is successful, navigate to services page
      if (res.data.success) {
        alert("Login successful.");
        navigate("/services");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Check console for details.");
    }
  };

  return (
    <div className="auth-page">
      {/* Navbar with brand link */}
      <div className="navbar">
        <h2>
          <Link to="/" className="nav-link">Legal Smiths</Link>
        </h2>
      </div>

      {/* Page header */}
      <div className="header">
        <h1>Login</h1>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit}>
        <div>
          {/* Email input */}
          <input
            type="email"
            name="email"
            id="email-input"
            placeholder="Enter your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Password input */}
          <input
            type="password"
            name="password"
            id="password-input"
            placeholder="Enter your Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Submit button */}
        <button type="submit">Login</button>
      </form>

      {/* Register redirect link */}
      <p className="link">
        New Here? <Link to="/register">Create an account</Link>
      </p>

      {/* Back button */}
      <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Login;
