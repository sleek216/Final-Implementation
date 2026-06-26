import React, { useState } from "react";
import { Link } from "react-router-dom";
import Mall3DExperience from "../mall3d/Mall3DExperience";
import "../styles/Mall3D.css";

export default function Mall3DPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`mall3d-page ${isPlaying ? "mall3d-page--playing" : ""}`}>
      <header className="mall3d-page-header">
        <Link to="/home" className="mall3d-back-link">← Back to Store</Link>
        <p className="mall3d-page-title">FashionVerse 3D Mall</p>
        <Link to="/3d-mall-ion" className="mall3d-alt-link">Try Ion Mall →</Link>
      </header>
      <Mall3DExperience onPlayStateChange={setIsPlaying} />
    </div>
  );
}