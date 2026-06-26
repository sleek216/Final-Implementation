// import React, { Component } from "react";
// import menuIcon from "../assets/icons/menu.svg";
// import searchIcon from "../assets/icons/search.svg";
// import bagIcon from "../assets/icons/shopping-bag.svg";

// class Navbar extends Component {
//   render() {
//     return (
//       <nav className="navbar">
//         <img src={menuIcon} alt="menu" className="nav-icon" />

//         <div className="nav-right">
//           <span className="login-text">LOGIN</span>
//           <img src={searchIcon} alt="search" className="nav-icon" />
//           <img src={bagIcon} alt="cart" className="nav-icon" />
//         </div>
//       </nav>
//     );
//   }
// }

// export default Navbar;

import React, { Component } from "react";
import { Link } from "react-router-dom";

import logo from "../assets/images/logo.jpg";
import menuIcon from "../assets/icons/menu.svg";
import searchIcon from "../assets/icons/search.svg";
import bagIcon from "../assets/icons/shopping-bag.svg";

class Navbar extends Component {
  state = {
    menuOpen: false,
  };

  toggleMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen });
  };

  render() {
    return (
      <nav className="navbar">
        {/* LEFT: MENU ICON (MOBILE) */}
        <img
          src={menuIcon}
          alt="menu"
          className="nav-icon mobile-only"
          onClick={this.toggleMenu}
        />

        {/* CENTER / LOGO */}
        <Link to="/home" className="nav-logo">
          <img src={logo} alt="FashionVerse Logo" className="nav-logo-img" />
        </Link>

        <div className={`nav-right ${this.state.menuOpen ? "open" : ""}`}>
          <Link to="/login" className="nav-link">
            LOGIN
          </Link>

          <Link to="/signup" className="nav-link">
            SIGN UP
          </Link>

          <img src={searchIcon} alt="search" className="nav-icon" />
          <img src={bagIcon} alt="cart" className="nav-icon" />
        </div>
      </nav>
    );
  }
}

export default Navbar;
