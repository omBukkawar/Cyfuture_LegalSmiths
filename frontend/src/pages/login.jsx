import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/auth.css";
import { NODE_API_URL } from "../config/api";
import { isAuthenticated } from "../utils/auth";

const Login = () => {
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("rememberedEmail")));
  const [formData, setFormData] = useState(() => ({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect already-logged-in users away from login page
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/services", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${NODE_API_URL}/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (res.data.success) {
        // Persist email only if Remember Me is opted in
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        // Store session tokens
        if (res.data.accessToken) {
          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        // Wipe inputs from component state
        setFormData({
          email: rememberMe ? formData.email : "",
          password: "",
        });

        navigate("/services");
      } else {
        setError(res.data.message || "Invalid credentials");
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please check credentials.");
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
        <h1>Login</h1>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={handleSubmit} autoComplete="off">
        <div>
          <input
            type="email"
            name="email"
            id="login-email"
            placeholder="Enter your Email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="off"
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="login-password"
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

          <div className="remember-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setRememberMe(checked);
                  if (!checked) {
                    localStorage.removeItem("rememberedEmail");
                  }
                }}
              />
              <span>Remember me</span>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="link">
        New Here? <Link to="/register">Create an account</Link>
      </p>

      <button className="back" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default Login;
