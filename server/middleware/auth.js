import jwt from "jsonwebtoken";
import User from "../models/User.js";

// VERIFY TOKEN
export const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded, UID:", decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.log("No user found for ID:", decoded.id);
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      console.log("User verified:", req.user.email);
      next();
    } catch (error) {
      console.error("verifyToken error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// VERIFY ADMIN
export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};
// VERIFY TOKEN (Optional - doesn't fail if no token)
export const verifyTokenOptional = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.log("Optional token failed or expired");
    }
  }
  next();
};
