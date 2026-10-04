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

export type WaitlistField = "name" | "email";

/** One message per invalid field. An empty object means the signup is valid. */
export type WaitlistFieldErrors = Partial<Record<WaitlistField, string>>;

/** Validate a whole waitlist signup, so each field can show its own error. */
export function validateWaitlist(values: Record<WaitlistField, string>): WaitlistFieldErrors {
  const errors: WaitlistFieldErrors = {};

  const name = validateName(values.name);
  if (!name.valid) errors.name = name.message ?? "Please enter your real name.";

  const email = validateEmail(values.email);
  if (!email.valid) errors.email = email.message ?? "Please enter a valid email address.";

  return errors;
}
