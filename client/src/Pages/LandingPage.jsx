import React, { Component } from "react";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import "../styles/LandingPage.css";

class LandingPage extends Component {
  render() {
    return (
      <div className="landing-container">

        <HeroSection />
        <Footer />
      </div>
    );
  }
}

export default LandingPage;
