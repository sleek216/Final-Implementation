import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/auth.css";
import api from "../api";

const SignupPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    const nameRegex = /^[a-zA-Z\s\.]+$/;
    if (!nameRegex.test(name.trim())) {
      toast.error("Full Name should only contain letters, spaces, or dots");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await api.post("/auth/register", {
        name,
        email,
        password
      });

      toast.success("Account created successfully. Please login.");
      navigate("/login");

    } catch (error) {
      toast.error("Signup failed. Email may already exist.");
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-page">
        <h2>Sign Up</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSignup}>Create Account</button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
