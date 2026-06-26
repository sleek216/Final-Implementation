import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import api from "../api";
import "../styles/Contact.css";

class ContactPage extends Component {
  state = {
    formData: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
    submitted: false,
    loading: false,
    error: null
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: value,
      },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: null });

    const { name, email, phone, subject, message } = this.state.formData;

    // Name validations
    const nameRegex = /^[a-zA-Z\s\.]+$/;
    if (!nameRegex.test(name.trim())) {
      this.setState({ error: "Name should only contain letters, spaces, or dots", loading: false });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      this.setState({ error: "Please enter a valid email address", loading: false });
      return;
    }

    // Optional Phone validation
    if (phone.trim()) {
      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
      const pkPhoneRegex = /^(?:\+92|92|0)?3\d{9}$/;
      if (!pkPhoneRegex.test(cleanedPhone)) {
        this.setState({ error: "Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX)", loading: false });
        return;
      }
    }

    try {
      await api.post("/contact/submit", this.state.formData);

      this.setState({
        submitted: true,
        loading: false,
        formData: {
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        }
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.setState({ submitted: false });
      }, 5000);

    } catch (err) {
      console.error("Submission error:", err);
      this.setState({
        error: err.response?.data?.message || "Failed to send message. Please try again.",
        loading: false
      });
    }
  };

  render() {
    const { formData, submitted } = this.state;

    return (
      <>
        <StoreNavbar />
        <main className="contact-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
            <Breadcrumbs paths={[{ label: "Contact Us", url: "/contact" }]} />
          </div>
          {/* Hero Section */}
          <section className="contact-hero">
            <div className="contact-hero-content">
              <h1>Get In Touch</h1>
              <p>We'd love to hear from you. Contact us anytime.</p>
            </div>
          </section>

          {/* Contact Content */}
          <section className="contact-content">
            <div className="contact-grid">
              {/* Contact Info */}
              <div className="contact-info">
                <h2>Contact Information</h2>

                <div className="info-card">
                  <h3>📍 Location</h3>
                  <p>
                    FashionVerse HQ<br />
                    123 Fashion Street<br />
                    Style City, SC 12345
                  </p>
                </div>

                <div className="info-card">
                  <h3>📞 Phone</h3>
                  <p>
                    <a href="tel:+1234567890">+1 (234) 567-890</a>
                  </p>
                </div>

                <div className="info-card">
                  <h3>✉️ Email</h3>
                  <p>
                    <a href="mailto:hello@fashionverse.com">hello@fashionverse.com</a><br />
                    <a href="mailto:support@fashionverse.com">support@fashionverse.com</a>
                  </p>
                </div>

                <div className="info-card">
                  <h3>🕐 Business Hours</h3>
                  <p>
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 4:00 PM<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-wrapper">
                <h2>Send us a Message</h2>

                {submitted && (
                  <div className="success-message">
                    ✓ Thank you! Your message has been sent successfully. We'll get back to you soon.
                  </div>
                )}

                {this.state.error && (
                  <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                    ✕ {this.state.error}
                  </div>
                )}

                <form className="contact-form" onSubmit={this.handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={this.handleInputChange}
                      required
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={this.handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={this.handleInputChange}
                      placeholder="+1 (000) 000-0000"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={this.handleInputChange}
                      required
                      placeholder="How can we help?"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={this.handleInputChange}
                      required
                      placeholder="Tell us more about your inquiry..."
                      rows="5"
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-btn" disabled={this.state.loading}>
                    {this.state.loading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
        <ProductFooter />
      </>
    );
  }
}

export default ContactPage;
