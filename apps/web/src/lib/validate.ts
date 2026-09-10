export interface ValidationResult {
  valid: boolean;
  message: string;
}

export function validateName(name: string): ValidationResult {
  const value = name.trim();

  if (!value) {
    return {
      valid: false,
      message: "Please enter your name.",
    };
  }

  if (value.length < 2) {
    return {
      valid: false,
      message: "Please enter a valid name.",
    };
  }

  if (/^(.)\1+$/.test(value)) {
    return {
      valid: false,
      message: "Please enter a valid name.",
    };
  }

  if (!/[aeiou]/i.test(value)) {
    return {
      valid: false,
      message: "Please enter a valid name.",
    };
  }

  if (new Set(value.toLowerCase().replace(/\s/g, "")).size < 2) {
    return {
      valid: false,
      message: "Please enter a valid name.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateEmail(email: string): ValidationResult {
  const value = email.trim();

  if (!value) {
    return {
      valid: false,
      message: "Please enter your email address.",
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(value)) {
    return {
      valid: false,
      message: "Please enter a valid email address.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

export function validateLanguage(language: string): ValidationResult {
  if (!language.trim()) {
    return {
      valid: false,
      message: "Please select your preferred language.",
    };
  }

  return {
    valid: true,
    message: "",
  };
}