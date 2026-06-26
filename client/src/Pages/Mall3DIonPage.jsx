import React from "react";
import { Link } from "react-router-dom";
import Mall3DCesiumExperience from "../mall3d/Mall3DCesiumExperience";
import "../styles/Mall3D.css";

export default function Mall3DIonPage() {
  return (
    <div className="mall3d-page">
      <header className="mall3d-page-header">
        <Link to="/home" className="mall3d-back-link">← Back to Store</Link>
        <p className="mall3d-page-title">FashionVerse 3D Mall (Cesium Ion)</p>
        <Link to="/3d-mall" className="mall3d-alt-link">GLB Mall →</Link>
      </header>
      <Mall3DCesiumExperience />
    </div>
  );
}
