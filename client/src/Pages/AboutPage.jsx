import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import "../styles/About.css";

class AboutPage extends Component {
  render() {
    return (
      <>
        <StoreNavbar />
        <main className="about-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <Breadcrumbs paths={[{ label: "About Us", url: "/about" }]} />
          </div>
          {/* Hero Section */}
          <section className="about-hero">
            <div className="about-hero-content">
              <h1>About FashionVerse</h1>
              <p>Redefining Digital Couture. Where Style Meets Innovation.</p>
            </div>
          </section>

          {/* About Content */}
          <section className="about-content">
            {/* Mission */}
            <div className="about-section">
              <h2>Our Mission</h2>
              <p>
                At FashionVerse, we believe fashion is more than just clothing—it's a form of self-expression
                and creativity. Our mission is to make luxury fashion accessible to everyone through innovative
                digital experiences and curated collections. We're committed to bringing the future of fashion
                to life by blending technology with timeless style.
              </p>
            </div>

            {/* Vision */}
            <div className="about-section">
              <h2>Our Vision</h2>
              <p>
                We envision a world where fashion transcends physical boundaries. Through immersive digital
                experiences, exclusive collections, and a thriving community of fashion enthusiasts, FashionVerse
                aims to be the ultimate destination for luxury fashion in the digital age.
              </p>
            </div>

            {/* Values */}
            <div className="about-section">
              <h2>Our Values</h2>
              <div className="values-grid">
                <div className="value-card">
                  <h3>Quality</h3>
                  <p>We curate only the finest brands and products for our discerning customers.</p>
                </div>
                <div className="value-card">
                  <h3>Innovation</h3>
                  <p>We push boundaries with cutting-edge technology and creative experiences.</p>
                </div>
                <div className="value-card">
                  <h3>Inclusivity</h3>
                  <p>Fashion is for everyone. We celebrate diversity and individual style.</p>
                </div>
                <div className="value-card">
                  <h3>Sustainability</h3>
                  <p>We're committed to ethical practices and sustainable fashion choices.</p>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="about-section">
              <h2>Our Story</h2>
              <p>
                FashionVerse was born from a passion for fashion and a vision to transform how people
                experience luxury shopping. What started as a dream to create a unique fashion platform has
                evolved into a thriving community of fashion lovers, designers, and entrepreneurs. Today, we're
                proud to be at the forefront of digital fashion innovation, bringing curated collections and
                exclusive experiences to fashion enthusiasts around the world.
              </p>
            </div>

            {/* Contact CTA */}
            <div className="about-cta">
              <h2>Have Questions?</h2>
              <p>Get in touch with our team for any inquiries or feedback.</p>
              <a href="/contact" className="cta-btn">
                Contact Us
              </a>
            </div>
          </section>
        </main>
        <ProductFooter />
      </>
    );
  }
}

export default AboutPage;
