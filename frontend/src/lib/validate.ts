export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/** Validate a waitlist signup name. */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  const errorMessage = "Please enter your real name.";

  if (!trimmed || trimmed.length < 2) return { valid: false, message: errorMessage };
  if (/^(.)\1+$/i.test(trimmed)) return { valid: false, message: errorMessage };
  if (/^[^aeiouAEIOU]*$/.test(trimmed) && /^[A-Z]+$/.test(trimmed))
    return { valid: false, message: errorMessage };
  if (/(.)\1{2,}/.test(trimmed)) return { valid: false, message: errorMessage };
  if (new Set(trimmed.replace(/\s/g, "")).size < 2) return { valid: false, message: errorMessage };

  return { valid: true };
}

/** Validate a waitlist signup email address. */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  return { valid: true };
}
