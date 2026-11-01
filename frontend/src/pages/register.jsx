import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/auth.css";
import { NODE_API_URL } from "../config/api";
import { isAuthenticated } from "../utils/auth";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect already-logged-in users away from register page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/services", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(`${NODE_API_URL}/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
      });

      if (res.data.success) {
        if (res.data.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        // Reset all fields immediately
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
        });

        setSuccess("Registration successful! Redirecting...");
        setTimeout(() => navigate("/services"), 1000);
      } else {
        setError(res.data.message || "Registration failed.");
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setFormData((prev) => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
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

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}

      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          type="text"
          name="name"
          id="reg-name"
          placeholder="Enter your Name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <input
          type="email"
          name="email"
          id="reg-email"
          placeholder="Enter your Email ID"
          value={formData.email}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="reg-password"
            placeholder="Enter your Password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <input
          type="tel"
          name="phone"
          id="reg-phone"
          placeholder="Enter your Phone No."
          value={formData.phone}
          onChange={handleChange}
          autoComplete="off"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <p className="link">
        Already have an account? <Link to="/login">Login here</Link>
      </p>

      <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Register;
