import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import axios from "axios";
import "../styles/auth.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async(e) => {
   e.preventDefault();
  try {
    const res = await axios.post("http://localhost:5000/login", {
      email: formData.email,
      password: formData.password,
    });

    alert(res.data.message);

    if (res.data.success) {
      alert("Login succesful.");
      navigate("/services");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed. Check console for details.");
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
        <h1>Login</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <input type="email" name="email" id="email-input" placeholder="Enter your Email" value={formData.Email} onChange={handleChange} required/>
        
        
          <label htmlFor="password-input"></label>
          <input type="password" name="password" id="password-input" placeholder="Enter your Password" value={formData.password}  onChange={handleChange} required/>
        
        </div>
        
          <button type="submit">Login</button>
        
      </form>

      <p className="link">
        New Here? <Link to="/register">Create an account</Link>
      </p>
        <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Login;
