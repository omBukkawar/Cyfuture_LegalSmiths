import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "../styles/auth.css";

const Login = () => {
  const [formData, setFormData] = useState({ Email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
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
          <input type="email" name="Email" id="Email-input" placeholder="Enter your Email" value={formData.Email} onChange={handleChange} required/>
        
        
          <label htmlFor="password-input"></label>
          <input type="password" name="password" id="password-input" placeholder="Enter your Password" value={formData.password}  onChange={handleChange} required/>
        
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
      </form>

      <p className="link">
        New Here? <Link to="/register">Create an account</Link>
      </p>
        <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Login;
