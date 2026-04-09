import "./Home.css";
import { Link } from "react-router-dom";
import { useContext, useMemo, useState, useEffect, useRef } from "react";
import { ProductContext } from "../context/ProductContext";
import { useLanguage } from "../context/LanguageContext";
import ancientMusic from "../assets/harumachimusic-ancient-wind-112528.mp3";

let hasShownWelcomeThisRuntime = false;


function Home() {
  const { products, ready } = useContext(ProductContext);
  const { t } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!hasShownWelcomeThisRuntime) {
      setShowWelcome(true);
      hasShownWelcomeThisRuntime = true;
    }
  }, []);

  useEffect(() => {
    if (showWelcome && audioRef.current) {
      // Attempt to play audio
      audioRef.current.play().catch((err) => {
        console.log("Audio autoplay blocked by browser:", err);
      });
    }
  }, [showWelcome]);

  const groupedProducts = useMemo(() => {
    const men = products.filter((product) => product.category === "men");
    const women = products.filter((product) => product.category === "women");

    return { men, women };
  }, [products]);

  const renderCollection = (title, items, emptyMessage) => (
    <div className="collection-block">
      <h3>{title}</h3>
      <div className="product-grid">
        {items.length === 0 ? (
          <p className="empty-text">{emptyMessage}</p>
        ) : (
          items.map((product) => {
            const price = Number(product.price) || 0;
            return (
              <div className="product-card" key={product.id}>
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/360x480?text=Product";
                  }}
                />
                <h4>{product.name}</h4>
                <p>₹{price.toLocaleString("en-IN")}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (showWelcome) {
    return (
      <div className="home-page welcome-overlay">
        <audio ref={audioRef} loop volume="0.5">
          <source src={ancientMusic} type="audio/mpeg" />
        </audio>

        <div className="glitter-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="glitter" 
              style={{ 
                "--delay": `${i * 0.1}s`,
                "--left": `${Math.random() * 100}%`,
                "--duration": `${2 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>

        <div className="welcome-container" onClick={(e) => e.stopPropagation()}>
          <div className="envelope-wrapper">
            <div className="envelope">
              <div className="envelope-flap"></div>
              <div className="envelope-body"></div>
            </div>
          </div>

          <div className="welcome-message">
            <p className="welcome-line line-1"><strong>{t("home.welcomeLine1")}</strong></p>
            
            <p className="welcome-line line-2">{t("home.welcomeLine2")}</p>
            
            <p className="welcome-line line-3">{t("home.welcomeLine3")}</p>
            
            <p className="welcome-line line-4">{t("home.welcomeLine4")}</p>
            
            <p className="welcome-line line-5"><strong>{t("home.welcomeLine5")}</strong></p>
          </div>

          <button className="skip-welcome" onClick={() => setShowWelcome(false)}>
            {t("home.enter")} →
          </button>

          <button 
            className="music-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (audioRef.current) {
                console.log("Audio paused:", audioRef.current.paused);
                if (audioRef.current.paused) {
                  audioRef.current.volume = 0.5;
                  audioRef.current.play().then(() => {
                    console.log("Audio playing");
                  }).catch((err) => {
                    console.log("Play failed:", err);
                  });
                } else {
                  audioRef.current.pause();
                  console.log("Audio paused");
                }
              }
            }}
            title="Toggle music"
          >
            🎵
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>{t("home.heroTitle")}</h1>
          <p>{t("home.heroDesc")}</p>
          <p className="hero-subtext">
            {t("home.heroSubtext")}
          </p>

          <div className="hero-buttons">
            <Link to="/shop" className="primary-btn">
              {t("home.shopNow")}
            </Link>

            <Link to="/artisan" className="secondary-btn">
              {t("home.explore")}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured">
        <h2>{t("home.featured")}</h2>
        <p className="featured-subtitle">{t("home.featuredSubtitle")}</p>

        {ready ? (
          <>
            {renderCollection(
              t("home.womenCollection"),
              groupedProducts.women,
              t("home.noWomenProducts")
            )}
            {renderCollection(
              t("home.menCollection"),
              groupedProducts.men,
              t("home.noMenProducts")
            )}
          </>
        ) : (
          <p className="loading-text">{t("home.loadingCollection")}</p>
        )}
      </section>
    </div>
  );
}

export default Home;