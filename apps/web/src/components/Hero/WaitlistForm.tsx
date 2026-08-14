"use client";
import { useState } from "react";
import styles from "@/styles/WaitlistForm.module.css";
import { validateName, validateEmail, validateLanguage } from "@/lib/validate";

interface WaitlistFormProps {
  onSuccess: (language: string) => void;
}

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
    if (!nameResult.valid) { setError(nameResult.message); return; }

    const emailResult = validateEmail(email);
    if (!emailResult.valid) { setError(emailResult.message); return; }

    const langResult = validateLanguage(language);
    if (!langResult.valid) { setError(langResult.message); return; }

    setError("");
    setLoading(true);

    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, language, source }),
      });
    } catch (err) {
      console.error("[waitlist] submission error:", err);
    } finally {
      setLoading(false);
      onSuccess(language);
    }
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit} id="waitlist" noValidate>
      <span className={styles.formLabel}>Join the waitlist</span>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="wl-name" className={styles.fieldLabel}>Name</label>
          <input
            id="wl-name"
            type="text"
            required
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
            autoComplete="name"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="wl-email" className={styles.fieldLabel}>Email address</label>
          <input
            id="wl-email"
            type="email"
            required
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
          />
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="wl-language" className={styles.fieldLabel}>Preferred language</label>
          <div className={styles.selectWrapper}>
            <select
              id="wl-language"
              required
              className={styles.select}
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>Select language</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="wl-source" className={styles.fieldLabel}>
            How did you find us?
            <span className={styles.fieldLabelOptional}>(optional)</span>
          </label>
          <div className={styles.selectWrapper}>
            <select
              id="wl-source"
              className={styles.select}
              value={source}
              onChange={e => setSource(e.target.value)}
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
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : "Join the waitlist →"}
      </button>
      <p className={styles.microcopy}>One email when we&apos;re ready — no newsletters, no spam.</p>
    </form>
  );
}
