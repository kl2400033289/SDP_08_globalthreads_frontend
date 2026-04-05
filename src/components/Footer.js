import { useLanguage } from "../context/LanguageContext";

function Footer() {
  const { t } = useLanguage();
  return (
    <footer style={{
      background: "#7A1E2C",
      color: "white",
      padding: "20px",
      textAlign: "center"
    }}>
      <p>{t("common.copyrightText", "© 2026 Global Threads — Empowering Handloom Artisans")}</p>
    </footer>
  );
}

export default Footer;