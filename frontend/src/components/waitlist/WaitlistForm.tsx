"use client";
import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import { validateEmail, validateName } from "@/lib/validate";

interface WaitlistFormProps {
  onSuccess: () => void;
}

const fieldLabelClass =
  "font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted";
const inputClass =
  "w-full rounded-[2px] border-[1.5px] border-line-heavy bg-paper px-[14px] py-[11px] font-sans text-[14px] text-ink outline-none focus:border-ink focus:bg-card";

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameResult = validateName(name);
    if (!nameResult.valid) {
      setError(nameResult.message ?? "Please enter your real name.");
      return;
    }

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      setError(emailResult.message ?? "Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
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
        onSuccess();
        return;
      }

      setError("Something went wrong. Please try again.");
    } catch (err) {
      console.error("[waitlist] submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="waitlist"
      className="scroll-mt-[72px] rounded-[2px] border-[1.5px] border-ink bg-card px-7 pb-[22px] pt-7 shadow-[4px_4px_0_rgba(15,20,25,0.07)]"
    >
      <form onSubmit={handleSubmit} noValidate>
        <span className="mb-[18px] block font-mono text-[9.5px] font-semibold uppercase tracking-[0.2em] text-muted">
          JOIN THE WAITLIST
        </span>
        <div className="mb-3 flex flex-col gap-3">
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="wl-name" className={fieldLabelClass}>
              NAME
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
              placeholder="Your name"
            />
          </div>
          <div className="relative flex flex-col gap-1.5">
            <label htmlFor="wl-email" className={fieldLabelClass}>
              EMAIL ADDRESS
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
              placeholder="you@example.com"
            />
          </div>
        </div>
        {error && (
          <p className="mb-2 font-mono text-[10px] text-red" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-[2px] border-none bg-ink px-5 py-3 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-card hover:bg-red disabled:cursor-not-allowed disabled:bg-line-heavy"
          disabled={loading}
        >
          {loading ? (
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-transparent border-t-white"
              aria-hidden="true"
            />
          ) : (
            "JOIN THE WAITLIST"
          )}
        </button>
        <p className="font-mono text-[9.5px] tracking-[0.04em] text-muted">
          You&apos;ll hear from us once, when Saransh is live.
        </p>
      </form>
    </div>
  );
}
