"use client";
import { useRef, useState } from "react";
import { primaryButtonClass } from "@/components/ui/buttonClasses";
import { getApiBaseUrl } from "@/lib/api-base";
import { logger } from "@/lib/logger";
import { validateWaitlist, type WaitlistField, type WaitlistFieldErrors } from "@/lib/validate";

interface WaitlistFormProps {
  onSuccess: () => void;
}

const GENERIC_ERROR = "Something went wrong. Please try again.";

const fieldLabelClass =
  "font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink";
const inputClass =
  "min-h-11 w-full rounded-[2px] border-[1.5px] border-line-heavy bg-card px-3 py-2.5 font-sans text-[13.5px] text-ink transition-colors placeholder:text-muted focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red aria-[invalid=true]:border-red dark:bg-paper";
const errorClass = "font-mono text-[10px] tracking-[0.04em] text-red";

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [values, setValues] = useState<Record<WaitlistField, string>>({ name: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState<WaitlistFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function handleChange(field: WaitlistField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errors = validateWaitlist(values);
    setFieldErrors(errors);
    setFormError("");

    if (errors.name) {
      nameRef.current?.focus();
      return;
    }
    if (errors.email) {
      emailRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name.trim(), email: values.email.trim() }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        duplicate?: boolean;
      };

      if (!response.ok) {
        setFormError(payload.message || GENERIC_ERROR);
        return;
      }

      if (payload.ok || payload.duplicate) {
        onSuccess();
        return;
      }

      setFormError(GENERIC_ERROR);
    } catch (err) {
      logger.error({ err }, "waitlist.submit_failed");
      setFormError(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="waitlist"
      className="scroll-mt-[72px] rounded-[2px] border-[1.5px] border-ink bg-card px-7 pb-[22px] pt-7 shadow-print"
    >
      <form onSubmit={handleSubmit} noValidate>
        <span className="mb-[18px] block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
          JOIN THE WAITLIST
        </span>
        <div className="mb-3 flex flex-col gap-3">
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="wl-name" className={fieldLabelClass}>
              NAME
            </label>
            <input
              ref={nameRef}
              id="wl-name"
              type="text"
              required
              className={inputClass}
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={loading}
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? "wl-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="wl-name-error" className={errorClass} role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="wl-email" className={fieldLabelClass}>
              EMAIL ADDRESS
            </label>
            <input
              ref={emailRef}
              id="wl-email"
              type="email"
              required
              className={inputClass}
              value={values.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={loading}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "wl-email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="wl-email-error" className={errorClass} role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>
        </div>
        {formError && (
          <p className={`mb-2 ${errorClass}`} role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          className={`${primaryButtonClass} mb-2.5 w-full disabled:cursor-not-allowed disabled:bg-line-heavy`}
          disabled={loading}
        >
          {loading ? (
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-transparent border-t-current"
              aria-hidden="true"
            />
          ) : (
            "JOIN THE WAITLIST"
          )}
        </button>
        <p className="font-mono text-[9.5px] leading-[1.65] tracking-[0.05em] text-muted">
          You&apos;ll hear from us once, when Saransh is live.
        </p>
      </form>
    </div>
  );
}
