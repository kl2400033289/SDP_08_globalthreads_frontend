import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "./Login.css"; // reuse same styles

function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState(1); // 1: username, 2: OTP, 3: new password
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [message, setMessage] = useState("");
  const [strength, setStrength] = useState("");

  // Step 1: Check username exists
  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const defaultUsers = [
      { username: "admin", password: "admin123", role: "admin" },
      { username: "artisan", password: "artisan123", role: "artisan" },
      { username: "buyer", password: "buyer123", role: "buyer" },
      { username: "marketing", password: "marketing123", role: "marketing" },
    ];
    const allUsers = [...defaultUsers, ...users];

    const userExists = allUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!userExists) {
      setMessage(t("forgot.usernameNotFound"));
      return;
    }

    setOldPassword(userExists.password);

    // generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    setStep(2);
    setMessage(`${t("forgot.otpMessagePrefix")}: ${otpCode} ${t("forgot.otpMessageSuffix")}`); // in real apps, send via email
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp !== generatedOtp) {
      setMessage(t("forgot.invalidOtp"));
      return;
    }
    setStep(3);
    setMessage("");
  };

  // Password strength check
  const checkStrength = (pwd) => {
    if (pwd.length < 4) return t("forgot.weak");
    if (pwd.match(/[a-z]/) && pwd.match(/[0-9]/)) return t("forgot.medium");
    if (pwd.match(/[a-z]/) && pwd.match(/[0-9]/) && pwd.match(/[!@#$%^&*]/))
      return t("forgot.strong");
    return t("forgot.weak");
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    setStrength(checkStrength(e.target.value));
  };

  // Step 3: Update password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage(t("signup.passwordMismatch"));
      return;
    }

    if (newPassword === oldPassword) {
      setMessage(t("forgot.newPasswordSameAsOld"));
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const index = users.findIndex(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (index !== -1) {
      users[index].password = newPassword;
      localStorage.setItem("users", JSON.stringify(users));
    } else {
      // check demo users (optional: allow changing demo passwords for testing)
      setMessage(
        t("forgot.cannotChangeDemo")
      );
      return;
    }

    setMessage(t("forgot.passwordUpdated"));
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="role-container">
      <h1 className="role-title">{t("forgot.title")}</h1>

      {step === 1 && (
        <form className="login-form" onSubmit={handleUsernameSubmit}>
          <input
            type="text"
            placeholder={t("forgot.enterUsername")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {message && <p className="error-text">{message}</p>}
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
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          {message && <p className="error-text">{message}</p>}
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
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {strength && <p>{t("forgot.passwordStrength")}: {strength}</p>}
          {message && <p className="error-text">{message}</p>}
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