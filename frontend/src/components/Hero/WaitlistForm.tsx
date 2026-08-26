"use client";
import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import { validateName, validateEmail, validateLanguage } from "@/lib/validate";

interface WaitlistFormProps {
  onSuccess: (language: string) => void;
}

const fieldLabelClass =
  "font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted";
const inputClass =
  "w-full rounded-sm border-[1.5px] border-line-heavy bg-surface px-3 py-2.5 font-sans text-sm text-ink outline-none transition-[border-color,background] focus:border-ink focus:bg-card";

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameResult = validateName(name);
    if (!nameResult.valid) {
      setError(nameResult.message ?? "Name is required.");
      return;
    }

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setError(emailResult.message ?? "Email is required.");
      return;
    }

    const langResult = validateLanguage(language);
    if (!langResult.valid) {
      setError(langResult.message ?? "Please select a language.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, language, source }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        duplicate?: boolean;
      };

      if (!response.ok) {
        setError(payload.message || "Something went wrong. Please try again.");
        return;
      }

      if (payload.ok || payload.duplicate) {
        onSuccess(language);
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch (err) {
      console.error("[waitlist] submission error:", err);
      setError("Unable to reach the server right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="rounded-sm border-[1.5px] border-ink bg-card p-7"
      onSubmit={handleSubmit}
      id="waitlist"
      noValidate
    >
      <span className="mb-4 block font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted">
        Join the waitlist
      </span>
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="relative flex flex-col gap-1.5">
          <label htmlFor="wl-name" className={fieldLabelClass}>
            Name
          </label>
          <input
            id="wl-name"
            type="text"
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoComplete="name"
          />
        </div>
        <div className="relative flex flex-col gap-1.5">
          <label htmlFor="wl-email" className={fieldLabelClass}>
            Email address
          </label>
          <input
            id="wl-email"
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="relative flex flex-col gap-1.5">
          <label htmlFor="wl-language" className={fieldLabelClass}>
            Preferred language
          </label>
          <div className="relative after:pointer-events-none after:absolute after:right-2.5 after:top-1/2 after:-translate-y-1/2 after:text-xs after:text-muted after:content-['↓']">
            <select
              id="wl-language"
              required
              className={`${inputClass} cursor-pointer appearance-none pr-8`}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>
                Select language
              </option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
        <div className="relative flex flex-col gap-1.5">
          <label htmlFor="wl-source" className={fieldLabelClass}>
            How did you find us?
            <span className="ml-1 font-normal normal-case tracking-normal text-line-heavy">
              (optional)
            </span>
          </label>
          <div className="relative after:pointer-events-none after:absolute after:right-2.5 after:top-1/2 after:-translate-y-1/2 after:text-xs after:text-muted after:content-['↓']">
            <select
              id="wl-source"
              className={`${inputClass} cursor-pointer appearance-none pr-8`}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={loading}
            >
              <option value="">Select</option>
              <option value="Twitter / X">Twitter / X</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="GitHub">GitHub</option>
              <option value="A friend">A friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
      {error && (
        <p className="mb-2 font-mono text-[10px] text-red" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-sm border-none bg-ink px-0 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-card transition-colors hover:bg-red disabled:cursor-not-allowed disabled:bg-line-heavy"
        disabled={loading}
      >
        {loading ? (
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-transparent border-t-white"
            aria-hidden="true"
          />
        ) : (
          "Join the waitlist →"
        )}
      </button>
      <p className="font-mono text-[9.5px] leading-[1.65] tracking-wide text-muted">
        One email when we&apos;re ready — no newsletters, no spam.
      </p>
    </form>
  );
}
