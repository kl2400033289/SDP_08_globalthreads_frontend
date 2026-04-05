import "./Login.css";   // reuse SAME CSS
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

function Signup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "buyer",
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setMessage({ text: "", type: "" });
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.username.trim().length < 3) {
      setMessage({ text: t("signup.usernameMin"), type: "error" });
      return;
    }

    if (!form.email.trim()) {
      setMessage({ text: t("signup.emailRequired"), type: "error" });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      setMessage({ text: t("signup.emailInvalid"), type: "error" });
      return;
    }

    if (form.password.length < 6) {
      setMessage({ text: t("signup.passwordMin"), type: "error" });
      return;
    }

    if (form.password !== confirmPassword) {
      setMessage({ text: t("signup.passwordMismatch"), type: "error" });
      return;
    }

    // get existing users
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // check if email already exists
    const emailExists = users.find((u) => {
      const normalizedEmail = u.email?.trim().toLowerCase();
      return normalizedEmail === form.email.trim().toLowerCase();
    });

    if (emailExists) {
      setMessage({ text: t("signup.emailExists"), type: "error" });
      return;
    }

    // save user
    users.push({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    });

    localStorage.setItem("users", JSON.stringify(users));

    setMessage({ text: t("signup.accountCreated"), type: "success" });

    // redirect to login after signup
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-badge">{t("signup.createAccount")}</p>
        <h1 className="auth-title">{t("signup.title")}</h1>
        <p className="auth-subtitle">
          {t("signup.subtitle")}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-username">{t("signup.username")}</label>
          <input
            id="signup-username"
            type="text"
            name="username"
            placeholder={t("signup.chooseUsername")}
            value={form.username}
            onChange={handleChange}
            required
          />

          <label htmlFor="signup-email">{t("signup.email")}</label>
          <input
            id="signup-email"
            type="email"
            name="email"
            placeholder={t("signup.enterEmail")}
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="signup-role">{t("signup.role")}</label>
          <select
            id="signup-role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="buyer">{t("signup.buyer")}</option>
            <option value="artisan">{t("signup.artisan")}</option>
            <option value="marketing">{t("signup.marketing")}</option>
          </select>

          <label htmlFor="signup-password">{t("signup.password")}</label>
          <div className="password-row">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={t("signup.createPassword")}
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? t("login.hide") : t("login.show")}
            </button>
          </div>

          <label htmlFor="signup-confirm-password">{t("signup.confirmPassword")}</label>
          <input
            id="signup-confirm-password"
            type={showPassword ? "text" : "password"}
            placeholder={t("signup.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => {
              setMessage({ text: "", type: "" });
              setConfirmPassword(e.target.value);
            }}
            required
          />

          {message.text && (
            <p
              className={`auth-message ${
                message.type === "success" ? "success-text" : "error-text"
              }`}
            >
              {message.text}
            </p>
          )}

          <button type="submit" className="primary-btn auth-submit">
            {t("signup.submit")}
          </button>
        </form>

        <p className="switch-auth-text">
          {t("signup.alreadyHave")}
          <span onClick={() => navigate("/login")}> {t("signup.login")}</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;