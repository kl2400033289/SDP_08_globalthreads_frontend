/**
 * Validation utility functions for form fields
 */

// Email validation - checks if email format is valid (abc@gmail.com)
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !email.trim()) {
    return { isValid: false, error: "Email is required" };
  }
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: "Please enter a valid email format (e.g., abc@gmail.com)" };
  }
  
  return { isValid: true, error: "" };
};

// Password validation - checks if password length is >= 6
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" };
  }
  
  return { isValid: true, error: "" };
};

const signupSpecialCharRegex = /[~!?@#$%^&*_\-+()[\]{}><\/\\|"'.,:;]/;

export const SIGNUP_PASSWORD_SPECIAL_CHARACTERS =
  "~ ! ? @ # $ % ^ & * _ - + ( ) [ ] { } > < / \\ | \" ' . , : ;";

export const validateSignupPassword = (password) => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }

  if (password.length > 128) {
    return { isValid: false, error: "Password cannot be more than 128 characters" };
  }

  if (/\s/.test(password)) {
    return { isValid: false, error: "Password must not contain spaces" };
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: "Password must include alphabets and numbers (not only symbols)",
    };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  if (!hasUppercase || !hasLowercase) {
    return {
      isValid: false,
      error: "Password must include at least one uppercase and one lowercase letter",
    };
  }

  return { isValid: true, error: "" };
};

export const getSignupPasswordStrength = (password) => {
  if (!password) {
    return "";
  }

  const lengthValid = password.length >= 8 && password.length <= 128;
  const hasNoSpaces = !/\s/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasLetter = /[A-Za-z]/.test(password);

  const requiredRulesValid =
    lengthValid && hasNoSpaces && hasUppercase && hasLowercase && hasNumber && hasLetter;

  if (!requiredRulesValid) {
    return "Weak";
  }

  if (signupSpecialCharRegex.test(password)) {
    return "Strong";
  }

  return "Medium";
};

// Phone number validation - checks if phone number has exactly 10 digits
export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\d{10}$/;
  
  if (!phone || !phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  const cleanPhone = phone.replace(/\D/g, "");
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }
  
  return { isValid: true, error: "" };
};

// Username validation - checks if username is at least 3 characters
export const validateUsername = (username) => {
  if (!username || !username.trim()) {
    return { isValid: false, error: "Username is required" };
  }
  
  if (username.trim().length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }
  
  return { isValid: true, error: "" };
};

// Combined validation for form object
export const validateForm = (form, fields) => {
  const errors = {};
  
  fields.forEach((field) => {
    switch (field) {
      case "email":
        const emailValidation = validateEmail(form.email);
        if (!emailValidation.isValid) {
          errors.email = emailValidation.error;
        }
        break;
      case "password":
        const passwordValidation = validatePassword(form.password);
        if (!passwordValidation.isValid) {
          errors.password = passwordValidation.error;
        }
        break;
      case "phone":
        const phoneValidation = validatePhoneNumber(form.phone);
        if (!phoneValidation.isValid) {
          errors.phone = phoneValidation.error;
        }
        break;
      case "username":
        const usernameValidation = validateUsername(form.username);
        if (!usernameValidation.isValid) {
          errors.username = usernameValidation.error;
        }
        break;
      default:
        break;
    }
  });
  
  return errors;
};
