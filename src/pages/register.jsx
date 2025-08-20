import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "../styles/auth.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
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
        <div>
        <input type="text" name="name" id="namme-input" placeholder="Enter your Name" value={formData.name} onChange={handleChange} required/>
        <input type="email" name="email" id="Email-input" placeholder="Enter your Email ID" value={formData.email} onChange={handleChange} required/>
        <input type="password" name="password" id="password-input" placeholder="Enter your Password" value={formData.password}onChange={handleChange} required/>
        <input type="tel" name="phone" placeholder="Enter your Phone No." value={formData.phone} onChange={handleChange} required/>
        <div>
        <button type="submit" className="register-btn">Register</button>
        </div>
        </div>
        </form>
        
        <p className="link">
          Already have an account?, <a href="/login">Login</a>
        </p>
        <button className="back" onClick={() => navigate(-1)}>Back</button>
      
    </div>
  );
};

export default Register;
