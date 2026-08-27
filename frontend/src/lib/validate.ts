export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/** Validate a waitlist signup name. */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, message: "Name is required." };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters." };
  }

  return { valid: true };
}

/** Validate a waitlist signup email address. */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, message: "Email is required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  return { valid: true };
}

/** Validate a preferred language selection. */
export function validateLanguage(language: string): ValidationResult {
  if (!language.trim()) {
    return { valid: false, message: "Please select a language." };
  }

  return { valid: true };
}
