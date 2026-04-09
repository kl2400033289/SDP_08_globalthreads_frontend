import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { loginUser } from "../api";
import { validateEmail, validatePassword } from "../utils/validation";

const parseJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

function Login() {
  const navigate = useNavigate();
  const { setAuthenticatedUser, login } = useContext(AuthContext);
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const demoAccounts = [
    {
      email: "admin@globalthreads.com",
      password: "admin123",
      role: "Admin",
    },
    {
      email: "artisan@globalthreads.com",
      password: "artisan123",
      role: "Artisan",
    },
    {
      email: "buyer@globalthreads.com",
      password: "buyer123",
      role: "Buyer",
    },
    {
      email: "marketing@globalthreads.com",
      password: "marketing123",
      role: "Marketing",
    },
  ];

  const handleChange = (e) => {
    setError("");
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Real-time validation
    if (name === "email") {
      const emailValidation = validateEmail(value);
      setFieldErrors(prev => ({
        ...prev,
        email: emailValidation.error
      }));
    } else if (name === "password") {
      const passwordValidation = validatePassword(value);
      setFieldErrors(prev => ({
        ...prev,
        password: passwordValidation.error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const fillDemoAccount = ({ email, password }) => {
    setForm({ email, password });
    setError("");
  };

  const quickAccessLogin = (account) => {
    fillDemoAccount(account);
    const result = login(account.email, account.password);

    if (result.success) {
      setError("");
      alert(`${account.role} demo login successful`);
      navigate("/", { replace: true });
      return;
    }

    setError("Quick access unavailable right now. Try normal login.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = form.email.trim();

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, email: emailValidation.error }));
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, password: passwordValidation.error }));
      setTouched(prev => ({ ...prev, password: true }));
      return;
    }

    try {
      const token = await loginUser({
        email,
        password: form.password,
      });
      console.log("Login token:", token);

      const payload = parseJwtPayload(token);
      const roleClaim =
        payload.role ||
        payload.userRole ||
        payload.authorities?.[0] ||
        payload.roles?.[0] ||
        "buyer";

      const normalizedRole =
        typeof roleClaim === "string"
          ? roleClaim.replace(/^ROLE_/i, "").toLowerCase()
          : "buyer";

      setAuthenticatedUser({
        email: payload.email || payload.sub || email,
        username: payload.username || payload.name || email.split("@")[0],
        role: normalizedRole,
      });

      alert("Login successful");
      navigate("/", { replace: true });
    } catch (apiError) {
      // Fallback to local demo/custom user auth when backend demo account is unavailable.
      const fallback = login(email, form.password);

      if (fallback.success) {
        alert("Login successful");
        navigate("/", { replace: true });
        return;
      }

      const errorText = apiError?.message || "Login failed";
      alert(errorText);
      setError(t("login.invalidCreds"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-badge">{t("login.welcomeBack")}</p>
        <h1 className="auth-title">{t("login.title")}</h1>
        <p className="auth-subtitle">
          {t("login.subtitle")}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">{t("login.email") || "Email"}</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder={t("login.enterEmail") || "Enter your email"}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {touched.email && fieldErrors.email && (
            <p className="error-text field-error">{fieldErrors.email}</p>
          )}

          <label htmlFor="password">{t("login.password")}</label>
          <div className="password-row">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={t("login.enterPassword")}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
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
          {touched.password && fieldErrors.password && (
            <p className="error-text field-error">{fieldErrors.password}</p>
          )}

          {error && <p className="auth-message error-text">{error}</p>}

          <button 
            type="submit" 
            className="primary-btn auth-submit"
            disabled={fieldErrors.email || fieldErrors.password}
          >
            {t("login.submit")}
          </button>
        </form>

        <p className="switch-auth-text">
          {t("login.noAccount")}
          <span onClick={() => navigate("/signup")}> {t("login.signUp")}</span>
        </p>

        <p className="switch-auth-text auth-link-secondary">
          <span onClick={() => navigate("/forgot-password")}>{t("login.forgotPassword")}</span>
        </p>

        <div className="demo-panel">
          <p className="demo-title">{t("login.quickDemo")}</p>
          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="demo-chip"
                onClick={() => quickAccessLogin(account)}
              >
                {account.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;