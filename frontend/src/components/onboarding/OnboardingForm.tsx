"use client";

import { Button, Field, Input, Select } from "@sutra_ui/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { submitOnboarding, type Answers } from "@/app/onboarding/actions";
import { track } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";
import type { Question } from "@/lib/server-api";

const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4 font-sans text-[13.5px] text-ink transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red";

/** Renders only the questions the User has not answered in Saransh or Rajniti. */
export default function OnboardingForm({ questions }: { questions: Question[] }) {
  const { update } = useSession();
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    await update();
    router.replace(ROUTES.stories);
  };

  // Answered elsewhere since this session began: refresh the session and move on.
  useEffect(() => {
    if (questions.length === 0) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answer = (key: string, value: string | string[]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const toggle = (key: string, option: string) => {
    const selected = (answers[key] as string[] | undefined) ?? [];
    answer(
      key,
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await submitOnboarding(answers);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    track("onboarding_completed", { asked: questions.length });
    await finish();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {questions.map((question) =>
        question.kind === "multi" ? (
          <fieldset key={question.key} className="flex flex-col gap-3">
            <legend className="mb-3 font-sans text-[14px] font-semibold text-ink">
              {question.label} <span className="font-normal text-muted">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => (
                <label key={option} className={chipClass}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={((answers[question.key] as string[]) ?? []).includes(option)}
                    onChange={() => toggle(question.key, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <Field key={question.key} label={question.label} required={question.required}>
            {question.kind === "single" ? (
              <Select
                placeholder="Choose one"
                required={question.required}
                value={(answers[question.key] as string) ?? ""}
                onChange={(event) => answer(question.key, event.target.value)}
              >
                {question.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                maxLength={100}
                value={(answers[question.key] as string) ?? ""}
                onChange={(event) => answer(question.key, event.target.value)}
              />
            )}
          </Field>
        ),
      )}
      {error && (
        <p role="alert" className="font-sans text-[13px] text-red">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" fullWidth isLoading={saving}>
        Continue to stories
      </Button>
    </form>
  );
}
