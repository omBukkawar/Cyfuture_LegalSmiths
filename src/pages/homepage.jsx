import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/homepage.css";

import img1 from "../assets/homepage_img1.jpg";
import img2 from "../assets/homepage_img2.jpg";
import img3 from "../assets/homepage_img3.jpg";
import img4 from "../assets/homepage_img4.jpeg";

const HomePage = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="homepage">
      <div className="top-bar">
        <Link to="/" className="brand">
          LegalSmiths
        </Link>
        <Link to="/login" className="login-link">
          Login
        </Link>
      </div>

      <main>
        <section className="about">
          <h1>About LegalSmiths</h1>
          <p className="about_text">
            Welcome to LegalSmiths! We are committed to providing modern, secure,
            and confidence-inspiring legal tech solutions for all users.
          </p>
          <div className="translucent">
            <h2>Trusted Legal Analysis Platform</h2>
            <p>
              LegalSmiths is trusted by users for accurate legal analysis and advice, ensuring confidence in legal matters.
            </p>
            <span className="shield-icon">🛡️</span>
          </div>
        </section>

        <section className="principles">
          <h2>Our Legal Principles</h2>
          <p>LegalSmiths upholds integrity and accuracy in legal analysis.</p>
          <p>
            We believe in empowering individuals with accessible legal advice
            and analysis through innovative technology.
          </p>
          <Link to="/services">
            <button className="services-btn">Go To Our Services</button>
          </Link>
          <div className="images-grid">
            <img src={img1} alt="principle 1" />
            <img src={img2} alt="principle 2" />
            <img src={img3} alt="principle 3" />
            <img src={img4} alt="principle 4" />
          </div>
        </section>

        <section className="meet">
          <h2>Meet Our Team</h2>
          <p>
            LegalSmiths was founded by legal and tech experts passionate about making
            legal analysis accessible to everyone.
          </p>
        </section>

        <section className="contact">
          <h2>Join LegalSmiths for AI-powered legal solutions.</h2>
          <p>
            “LegalSmiths is a game-changer in the legal tech industry. The platform is
            intuitive, secure, and provides accurate legal analysis. I highly recommend
            it to anyone seeking legal advice.” - Victoria White
          </p>
          <Link to="/contact">
            <button className="contact-btn">Contact Us</button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
