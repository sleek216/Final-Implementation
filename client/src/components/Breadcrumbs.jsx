import React from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineHome } from 'react-icons/ai';
import '../styles/Breadcrumbs.css';

const Breadcrumbs = ({ paths }) => {
    return (
        <nav className="breadcrumbs-container" aria-label="Breadcrumb">
            <ol className="breadcrumbs-list">
                <li className="breadcrumb-item">
                    <Link to="/home" className="breadcrumb-link home-icon-link">
                        <AiOutlineHome className="home-icon" />
                        <span>Home</span>
                    </Link>
                </li>
                {paths && paths.filter(p => p.label !== "Home").map((path, index) => {
                    const isLast = index === paths.filter(p => p.label !== "Home").length - 1;
                    return (
                        <li key={index} className="breadcrumb-item">
                            <span className="breadcrumb-separator">›</span>
                            {isLast ? (
                                <span className="breadcrumb-current" aria-current="page">{path.label}</span>
                            ) : (
                                <Link to={path.url} className="breadcrumb-link">{path.label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
