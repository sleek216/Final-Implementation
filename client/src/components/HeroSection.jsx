import React, { Component } from "react";
import splashImage from "../assets/images/fashion-model-splash.jpg";
import arrowIcon from "../assets/icons/arrow-forward.svg";
import { Link } from "react-router-dom";


class HeroSection extends Component {
  render() {
    return (
      <section
        className="hero"
        style={{ backgroundImage: `url(${splashImage})` }}
      >
        <div className="overlay"></div>

        <div className="hero-content">
          <p className="season">AUTUMN / WINTER </p>

          <h1 className="title">FASHIONVERSE</h1>

          <p className="subtitle">
            Where Your Vibe Becomes Reality
          </p>

          <Link to="/home" className="enter-btn">
            ENTER STORE
            <img src={arrowIcon} alt="arrow" />
          </Link>

        </div>
      </section>
    );
  }
}

export default HeroSection;
