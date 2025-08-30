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
            Welcome to LegalSmiths! We are committed to providing modern,
            secure, and confidence-inspiring legal tech solutions for all users.
          </p>
          <div className="translucent">
            <h2>Trusted Legal Analysis Platform</h2>
            <p>
              LegalSmiths is trusted by users for accurate legal analysis and
              advice, ensuring confidence in legal matters.
            </p>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="85px"
              viewBox="0 -960 960 960"
              width="80px"
              fill="white"
            >
              <path d="m438-338 226-226-57-57-169 169-84-84-57 57 141 141Zm42 258q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z" />
            </svg>
          </div>
        </section>

        <section className="principles">
          <div className="principles-content">
            <div className="principles-text">
              <h2>Our Legal Principles</h2>
              <ul>
                <li>
                LegalSmiths upholds integrity and accuracy in legal analysis.
                </li>
                <li>
                We believe in empowering individuals with accessible legal
                advice and analysis through innovative technology.
                </li>
              </ul>
                
              <Link to="/services">
                <button className="services-btn">Go To Our Services<svg xmlns="http://www.w3.org/2000/svg" height="44px" viewBox="0 -960 960 960" width="44px" fill="#e3e3e3"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg></button>
              </Link>
            </div>

            <div className="principles-image-main">
              <img src={img1} alt="principle main" />
            </div>
          </div>

          <div className="principles-gallery">
            <div className="gallery-item left">
              <img src={img4} alt="principle 2" />
            </div>
            <div className="gallery-item center">
              <img src={img2} alt="principle 3" />
            </div>
            <div className="gallery-item right">
              <img src={img3} alt="principle 4" />
            </div>
          </div>
        </section>

        <section className="meet">
          <h2>Meet Our Team</h2>
          <p>
            LegalSmiths was founded by legal and tech experts passionate about
            making legal analysis accessible to everyone.
          </p>
        </section>

        <section className="contact">
          <h2>Join LegalSmiths for AI-powered legal solutions.</h2>
          <p>
            “LegalSmiths is a game-changer in the legal tech industry. The
            platform is intuitive, secure, and provides accurate legal analysis.
            I highly recommend it to anyone seeking legal advice.” - Victoria
            White
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
