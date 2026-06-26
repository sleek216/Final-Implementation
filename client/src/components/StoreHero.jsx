import React from "react";
import { Link } from "react-router-dom";
import model2D from "../assets/images/pakistani_luxe_couture_model.png";
import mall3D from "../assets/images/virtual_3d_boutique_concept.png";

const StoreHero = () => {
  return (
    <section className="store-hero">
      <div className="hero-decor-motif left"></div>
      <div className="hero-decor-motif right"></div>

      <div className="hero-text">
        <span className="season">RIWAYAT & INNOVATION</span>
        <h1 className="hero-title">
          Heritage Couture, <br />
          <span className="accent-gold">Virtual Realities</span>
        </h1>
        <p className="hero-description">
          Step into a luxurious dimension where timeless Pakistani craftsmanship meets cutting-edge virtual retail. Explore our elegant 2D curated catalogs or walk through our immersive 3D virtual boutiques.
        </p>

        <div className="hero-experience-pills">
          <div className="experience-pill">
            <span className="pill-dot 2d"></span>
            <div>
              <strong>2D PRET & COUTURE</strong>
              <p>Curated flat collections & catalogs</p>
            </div>
          </div>
          <div className="experience-pill">
            <span className="pill-dot 3d"></span>
            <div>
              <strong>3D IMMERSIVE STREET</strong>
              <p>Walkable virtual stores</p>
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <button
            className="btn-hero btn-primary-gold"
            onClick={() => document.getElementById('brands')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Shop 2D Catalog
          </button>
          <Link to="/unity-mall?spawn=entrance" className="btn-hero btn-secondary-outline">
            Enter 3D Mall
            <span className="pulse-badge">Live</span>
          </Link>
        </div>
      </div>

      <div className="hero-collage-container">
        <div className="collage-bg-arch"></div>

        {/* Card 1: 2D Couture */}
        <div className="collage-card card-2d" onClick={() => document.getElementById('brands')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="card-image-wrapper">
            <img src={model2D} alt="2D Pret Couture" />
            <div className="card-label-overlay">
              <span className="label-category">Pret & Couture</span>
              <h3>2D COLLECTION</h3>
              <span className="btn-explore-mini">Explore Catalog &rarr;</span>
            </div>
          </div>
        </div>

        {/* Card 2: 3D Immersive */}
        <Link to="/unity-mall?spawn=entrance" className="collage-card card-3d">
          <div className="card-image-wrapper">
            <img src={mall3D} alt="3D Immersive Mall" />
            <div className="card-label-overlay">
              <span className="label-category">Cesium 3D World</span>
              <h3>3D VIRTUAL MALL</h3>
              <span className="btn-explore-mini special-glow">Walk Through &rarr;</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default StoreHero;
