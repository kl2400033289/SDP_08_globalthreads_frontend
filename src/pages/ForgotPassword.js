import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  resetForgotPassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../api";
import {
  getSignupPasswordStrength,
  validateSignupPassword,
} from "../utils/validation";
import "./Login.css"; // reuse same styles

function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [strength, setStrength] = useState("");

  const getStoredUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("users")) || [];
    } catch {
      return [];
    }
  };

  const updateStoredUserPassword = (targetEmail, nextPassword) => {
    const users = getStoredUsers();
    let didUpdate = false;

    const updatedUsers = users.map((user) => {
      const userEmail = user.email?.trim().toLowerCase();

      if (userEmail === targetEmail) {
        didUpdate = true;
        return { ...user, password: nextPassword };
      }

      return user;
    });

    if (didUpdate) {
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }

    return didUpdate;
  };

  const setError = (text) => setMessage({ text, type: "error" });
  const setSuccess = (text) => setMessage({ text, type: "success" });

  // Step 1: Send OTP to email
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const responseText = await sendForgotPasswordOtp(normalizedEmail);
      setStep(2);
      setSuccess(responseText || "OTP sent successfully.");
    } catch (error) {
      setError(error?.message || "Unable to send OTP. Please try again.");
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    try {
      const responseText = await verifyForgotPasswordOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      setStep(3);
      setNewPassword(""); // Reset new password field
      setConfirmPassword(""); // Reset confirm password field
      setStrength("");
      setSuccess(responseText || "OTP verified successfully.");
    } catch (error) {
      setError(error?.message || "Invalid OTP. Please try again.");
    }
  };

  // Password strength check
  const checkStrength = (pwd) => {
    const strength = getSignupPasswordStrength(pwd);

    if (!strength) {
      return "";
    }

    return t(`forgot.${strength.toLowerCase()}`) || strength;
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    setStrength(checkStrength(e.target.value));
  };

  // Step 3: Update password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const passwordValidation = validateSignupPassword(newPassword);

    if (!passwordValidation.isValid) {
      setError(passwordValidation.error);
      return;
    }

    // Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      setError(t("signup.passwordMismatch"));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedUser = getStoredUsers().find(
      (user) => user.email && user.email.trim().toLowerCase() === normalizedEmail
    );

    // Prevent reusing the current stored password.
    if (storedUser && storedUser.password === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    try {
      const responseText = await resetForgotPassword({
        email: normalizedEmail,
        otp: otp.trim(),
        newPassword,
      });

      updateStoredUserPassword(normalizedEmail, newPassword);

      setSuccess(responseText || t("forgot.passwordUpdated"));
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(error?.message || "Could not reset password. Please try again.");
    }
  };

  return (
    <div className="role-container">
      <h1 className="role-title">{t("forgot.title")}</h1>

      {step === 1 && (
        <form className="login-form" onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder={t("signup.enterEmail")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            required
          />
          {message.text && (
            <p className={message.type === "success" ? "success-text" : "error-text"}>
              {message.text}
            </p>
          )}
          <button type="submit" className="primary-btn">
            {t("forgot.next")}
          </button>
        </form>
      )}

      {step === 2 && (
        <form className="login-form" onSubmit={handleOtpSubmit}>
          <input
            type="text"
            placeholder={t("forgot.enterOtp")}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            required
          />
          {message.text && (
            <p className={message.type === "success" ? "success-text" : "error-text"}>
              {message.text}
            </p>
          )}
          <button type="submit" className="primary-btn">
            {t("forgot.verifyOtp")}
          </button>
        </form>
      )}

      {step === 3 && (
        <form className="login-form" onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder={t("forgot.newPassword")}
            value={newPassword}
            onChange={handlePasswordChange}
            required
          />
          <input
            type="password"
            placeholder={t("forgot.confirmPassword")}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMessage({ text: "", type: "" });
            }}
            required
          />
          {strength && <p>{t("forgot.passwordStrength")}: {strength}</p>}
          {message.text && (
            <p className={message.type === "success" ? "success-text" : "error-text"}>
              {message.text}
            </p>
          )}
          <button type="submit" className="primary-btn">
            {t("forgot.resetPassword")}
          </button>
        </form>
      )}

      <p style={{ marginTop: "20px" }}>
        {t("forgot.remembered")}{" "}
        <span
          style={{ color: "#8b1e2d", cursor: "pointer", fontWeight: "600" }}
          onClick={() => navigate("/login")}
        >
          {t("forgot.login")}
        </span>
      </p>
    </div>
  );
}

export default ForgotPassword;