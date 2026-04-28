import "./Login.css";   // reuse SAME CSS
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import { registerUser } from "../api";
import {
  getSignupPasswordStrength,
  SIGNUP_PASSWORD_SPECIAL_CHARACTERS,
  validateEmail,
  validatePhoneNumber,
  validateSignupPassword,
  validateUsername,
} from "../utils/validation";

function Signup() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "buyer",
  });

  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    phone: false,
  });

  const passwordStrength = getSignupPasswordStrength(form.password);

  const handleChange = (e) => {
    setMessage({ text: "", type: "" });
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Real-time validation
    if (name === "username") {
      const usernameValidation = validateUsername(value);
      setFieldErrors(prev => ({
        ...prev,
        username: usernameValidation.error
      }));
    } else if (name === "email") {
      const emailValidation = validateEmail(value);
      setFieldErrors(prev => ({
        ...prev,
        email: emailValidation.error
      }));
    } else if (name === "password") {
      const passwordValidation = validateSignupPassword(value);
      setFieldErrors(prev => ({
        ...prev,
        password: passwordValidation.error
      }));
    } else if (name === "phone") {
      const phoneValidation = validatePhoneNumber(value);
      setFieldErrors(prev => ({
        ...prev,
        phone: phoneValidation.error
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

  const sendOtp = async () => {
    try {
      await axios.post("http://localhost:8080/auth/signup/send-otp", {
        email,
      });

      alert("OTP sent!");
      setOtpSent(true);
      setOtpVerified(false);
    } catch (error) {
      alert("Error sending OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8080/auth/signup/verify-otp",
        { email, otp }
      );

      if (response.data === true || response.data === "true") {
        alert("OTP verified!");
        setOtpVerified(true);
      } else {
        alert("Invalid OTP");
      }
    } catch (error) {
      alert("Verification failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpVerified) {
      alert("Verify email first!");
      return;
    }

    // Validate username
    const usernameValidation = validateUsername(form.username);
    if (!usernameValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, username: usernameValidation.error }));
      setTouched(prev => ({ ...prev, username: true }));
      return;
    }

    // Validate email
    const emailValidation = validateEmail(form.email);
    if (!emailValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, email: emailValidation.error }));
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }

    // Validate password
    const passwordValidation = validateSignupPassword(form.password);
    if (!passwordValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, password: passwordValidation.error }));
      setTouched(prev => ({ ...prev, password: true }));
      return;
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(form.phone);
    if (!phoneValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, phone: phoneValidation.error }));
      setTouched(prev => ({ ...prev, phone: true }));
      return;
    }

    if (form.password !== confirmPassword) {
      setMessage({ text: t("signup.passwordMismatch"), type: "error" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
      const responseText = await registerUser({
        username: form.username.trim(),
        email: normalizedEmail,
        password: form.password,
      });

      storedUsers.push({
        id: Date.now(),
        username: form.username.trim(),
        email: normalizedEmail,
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
      });
      localStorage.setItem("users", JSON.stringify(storedUsers));

      alert(responseText);
      setMessage({ text: t("signup.accountCreated"), type: "success" });
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      const errorText = error?.message || "Signup failed";
      alert(errorText);
      setMessage({ text: String(errorText), type: "error" });
    }
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
            onBlur={handleBlur}
            required
          />
          {touched.username && fieldErrors.username && (
            <p className="error-text field-error">{fieldErrors.username}</p>
          )}

          <label htmlFor="signup-email">{t("signup.email")}</label>
          <input
            id="signup-email"
            type="email"
            name="email"
            placeholder={t("signup.enterEmail")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setForm({ ...form, email: e.target.value });
              setOtpSent(false);
              setOtpVerified(false);
              setOtp("");
            }}
            onBlur={handleBlur}
            required
          />
          {touched.email && fieldErrors.email && (
            <p className="error-text field-error">{fieldErrors.email}</p>
          )}

          <button
            type="button"
            className="primary-btn auth-submit"
            onClick={sendOtp}
            disabled={!email.trim()}
          >
            Send OTP
          </button>

          {otpSent && !otpVerified && (
            <>
              <label htmlFor="signup-otp">Enter OTP</label>
              <input
                id="signup-otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button
                type="button"
                className="primary-btn auth-submit"
                onClick={verifyOtp}
                disabled={!otp.trim()}
              >
                Verify OTP
              </button>
            </>
          )}

          {otpVerified && (
            <>
              <label htmlFor="signup-phone">Phone Number (10 digits)</label>
              <input
                id="signup-phone"
                type="tel"
                name="phone"
                placeholder="1234567890"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.phone && fieldErrors.phone && (
                <p className="error-text field-error">{fieldErrors.phone}</p>
              )}

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
                <option value="admin">{t("signup.admin")}</option>
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
              {passwordStrength && (
                <p
                  className={`password-strength ${passwordStrength.toLowerCase()}`}
                >
                  Password strength: {passwordStrength}
                </p>
              )}
              <div className="password-rules">
                <p>Use a password with:</p>
                <p>At least 8 characters and no more than 128 characters.</p>
                <p>At least one uppercase and one lowercase letter.</p>
                <p>At least one numeral and no spaces.</p>
                <p>
                  Add at least one special character for Strong:
                  {` ${SIGNUP_PASSWORD_SPECIAL_CHARACTERS}`}
                </p>
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

              <button 
                type="submit" 
                className="primary-btn auth-submit"
                disabled={
                  fieldErrors.username || 
                  fieldErrors.email || 
                  fieldErrors.password || 
                  fieldErrors.phone ||
                  !confirmPassword ||
                  form.password !== confirmPassword
                }
              >
                {t("signup.submit")}
              </button>
            </>
          )}
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
