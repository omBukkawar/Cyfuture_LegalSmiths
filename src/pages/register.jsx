import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import "../styles/auth.css";

const Register = () => {
  const navigate = useNavigate();

  // State for registration form inputs
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // Handle input field changes dynamically
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send registration request to backend
      const res = await axios.post("http://localhost:5000/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone, // match backend field name
      });

      alert(res.data.message);

      // Redirect to login page after successful registration
      if (res.data.success) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed. Check console for details.");
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
        <h1>Register</h1>
      </div>

      {/* Registration form */}
      <form onSubmit={handleSubmit}>
        {/* Name input */}
        <input
          type="text"
          name="name"
          placeholder="Enter your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        {/* Email input */}
        <input
          type="email"
          name="email"
          placeholder="Enter your Email ID"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Password input */}
        <input
          type="password"
          name="password"
          placeholder="Enter your Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Phone number input */}
        <input
          type="tel"
          name="phone"
          placeholder="Enter your Phone No."
          value={formData.phone}
          onChange={handleChange}
          required
        />

        {/* Submit button */}
        <div>
          <button type="submit" className="register-btn">Register</button>
        </div>
      </form>

      {/* Redirect link for existing users */}
      <p className="link">
        Already have an account? <Link to="/login">Login</Link>
      </p>

      {/* Back button */}
      <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Register;
