// App.js
import { useState, useEffect, useRef } from 'react'
import { Upload, Search, Zap, Menu, X, Linkedin, Twitter, Facebook } from 'lucide-react'
import {Link} from 'react-router-dom'
import './App.css'

function App() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const featuresRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    const elements = document.querySelectorAll('.feature-card')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
          }
        })
      },
      { threshold: 0.1 }
    )

    elements.forEach(el => observer.observe(el))
    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      elements.forEach(el => observer.unobserve(el))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen &&
        !event.target.closest('.nav-links') &&
        !event.target.closest('.menu-toggle')) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const features = [
    {
      icon: <Upload size={36} strokeWidth={1.5} className="feature-icon" />,
      title: "Analyse de CV",
      description: "Analysez votre CV avec l'IA pour des matchings précis et pertinents",
      precision: "98% de précision"
    },
    {
      icon: <Search size={36} strokeWidth={1.5} className="feature-icon" />,
      title: "Recommandations",
      description: "Suggestions personnalisées basées sur vos compétences et aspirations",
      precision: "+50 offres par jour"
    },
    {
      icon: <Zap size={36} strokeWidth={1.5} className="feature-icon" />,
      title: "Matching Instantané",
      description: "Trouvez des opportunités correspondant à votre profil en temps réel",
      precision: "< 1 min de matching"
    }
  ]

  return (
    <div className="home-content">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="logo">CareerCompass</div>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <div className="nav-links-content">
              <a 
                href="#features" 
                onClick={(e) => { 
                  e.preventDefault()
                  handleScrollToFeatures()
                  setMenuOpen(false)
                }}
              >
                Fonctionnalités
              </a>
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div 
        className={`mobile-backdrop ${menuOpen ? 'active' : ''}`} 
        onClick={() => setMenuOpen(false)}
      ></div>

      <section className="hero">
        <div className="hero-content">
          <h1>Trouvez votre emploi idéal</h1>
          <p>
            Téléchargez votre CV et découvrez les meilleures opportunités 
            adaptées à votre profil
          </p>
          <button className="home-btn pulse">
              <Link to="/register" style={{ color: 'inherit', textDecoration: 'none', display: 'block', width: '100%', height: '100%' }}>
                Commencer maintenant
              </Link>
            </button>
        </div>
      </section>

      <section id="features" className="features" ref={featuresRef}>
        <h2>Nos fonctionnalités</h2>
        <p className="subtitle">
          Découvrez nos outils pour améliorer votre recherche d'emploi
        </p>
        <div className="feature-cards">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {feature.icon}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="precision">{feature.precision}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
      <div className="footer-container">
          <div className="footer-section">
            <h2 className="footer-title">CareerCompass</h2>
            <p className="footer-description">
              Votre partenaire pour une carrière pertinente et épanouissante.
            </p>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Contact</h3>
            <div className="contact-info">
              <p><strong>Email:</strong> contact@careercompass.com</p>
              <p><strong>Téléphone:</strong> +212 623 456 789</p>
              <p><strong>Adresse:</strong> Avenue Mohamed Ben Abdellah Regragui, Rabat</p>
            </div>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Suivez-nous</h3>
            <div className="social-icons">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin size={24} />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 CareerCompass. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

export default App