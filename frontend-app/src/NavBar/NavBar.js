import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import './NavBar.css';

const NavBar = ({ links = [], showLogout = false }) => {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const burgerRef = useRef();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !burgerRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="nav-bar-container">
      <div className="nav-bar-logo">CareerCompass</div>

      <div
        className={`nav-bar-links ${menuOpen ? 'active' : ''}`}
        ref={menuRef}
      >
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="nav-bar-link"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        {showLogout && (
          <button
            className="nav-bar-link nav-bar-logout-btn"
            onClick={() => { handleLogout(); setMenuOpen(false); }}
          >
            Déconnexion
          </button>
        )}
      </div>

      <div
        className="nav-bar-burger"
        onClick={() => setMenuOpen(!menuOpen)}
        ref={burgerRef}
      >
        {menuOpen ? (
          <span className="close-icon">✖</span>
        ) : (
          <span className="burger-icon">☰</span>
        )}
      </div>
    </nav>
  );
};

export default NavBar;