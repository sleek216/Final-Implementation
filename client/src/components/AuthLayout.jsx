import React, { Component } from "react";
import authImage from "../assets/images/login.jpg";
import "../styles/Auth.css";


class AuthLayout extends Component {
  render() {
    return (
      <div
        className="auth-bg"
        style={{ backgroundImage: `url(${authImage})` }}
      >
        {/* Transparent form in center */}
        <div className="auth-form-glass">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default AuthLayout;
