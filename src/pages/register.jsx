import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios"; // <-- import axios
import "../styles/auth.css";

const Register = () => {
  const navigate=useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone, // match backend field
      });

      alert(res.data.message); // show response message

      if (res.data.success) {
        navigate("/login"); // optional: redirect to login after registration
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Registration failed. Check console for details.");
    }
  };

  return (
    <div className="auth-page">
      <div className="navbar">
        <h2>
          <Link to="/" className="nav-link">Legal Smiths</Link>
        </h2>
      </div>
      <div className="header">
        <h1>Register</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Enter your Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Enter your Email ID"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Enter your Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Enter your Phone No."
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <div>
          <button type="submit" className="register-btn">Register</button>
        </div>
      </form>

      <p className="link">
        Already have an account? <Link to="/login">Login</Link>
      </p>

      <button className="back" onClick={() => navigate(-1)}>Back</button>

    </div>
  );
};

export default Register;