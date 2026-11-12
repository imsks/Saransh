"use client";

import { Button, Field, Input } from "@sutra_ui/ui";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { submitOnboarding } from "@/app/onboarding/actions";
import { COMING_SOON_INTERESTS, STATES, TOPICS } from "@/constants/onboarding";
import { track } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";
import type { OnboardingField } from "@/lib/server-api";

const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line px-4 font-sans text-[13.5px] text-ink transition-colors has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-red";

const TOPIC_LIMIT = 3;

/** Renders only the questions the shared `users` row has no answer for yet. */
export default function OnboardingForm({
  missingFields,
}: {
  missingFields: OnboardingField[];
}) {
  const { update, status } = useSession();
  const router = useRouter();
  const askName = missingFields.includes("name");
  const askState = missingFields.includes("state");
  const askTopics = missingFields.includes("topics");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedTopics = new Set(topics);
  const selectedInterests = new Set(interests);
  const filteredStates = STATES.filter((option) =>
    option.toLocaleLowerCase().includes(stateSearch.trim().toLocaleLowerCase()),
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (status !== "authenticated") {
      setError("Please sign in again.");
      return;
    }
    if (askName && !name.trim()) {
      setError("Name is required.");
      return;
    }
    if (askState && !state) {
      setError("State is required.");
      return;
    }

    setSaving(true);
    try {
      const result = await submitOnboarding({
        ...(askName ? { name: name.trim() } : {}),
        ...(askState ? { state } : {}),
        ...(askTopics ? { topics, coming_soon_interests: interests } : {}),
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      track("onboarding_completed", {
        name_asked: askName,
        state_asked: askState,
        topic_count: topics.length,
      });
      const session = await update({});
      if (!session) {
        setError("Your edition was saved, but your session could not be refreshed. Please try again.");
        return;
      }
      router.replace(ROUTES.stories);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {askName && (
        <Field label="Name" required>
          <Input
            autoComplete="name"
            maxLength={100}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      )}

      {askState && (
        <fieldset className="flex flex-col gap-3" aria-required="true">
          <legend className="font-sans text-[14px] font-semibold text-ink">
            State <span className="font-normal text-red">Required</span>
          </legend>
          <Field label="Search states">
            <Input
              type="search"
              autoComplete="off"
              placeholder="Search states"
              value={stateSearch}
              onChange={(event) => setStateSearch(event.target.value)}
            />
          </Field>
          <div
            role="radiogroup"
            aria-label="State"
            aria-required="true"
            className="flex max-h-56 flex-wrap gap-2 overflow-y-auto"
          >
            {filteredStates.map((option) => (
              <label key={option} className={chipClass}>
                <input
                  type="radio"
                  name="state"
                  className="sr-only"
                  value={option}
                  checked={state === option}
                  onChange={() => {
                    setState(option);
                    setStateSearch("");
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {askTopics && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-sans text-[14px] font-semibold text-ink">
            Topics <span className="font-normal text-muted">(optional, choose up to 3)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <label key={topic.value} className={chipClass}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedTopics.has(topic.value)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    if (checked && topics.length >= TOPIC_LIMIT) {
                      setError("Choose up to 3 topics.");
                      return;
                    }
                    setError("");
                    setTopics((current) =>
                      checked
                        ? [...current, topic.value]
                        : current.filter((value) => value !== topic.value),
                    );
                  }}
                />
                {topic.label}
              </label>
            ))}
          </div>
          <p className="font-sans text-[13px] text-muted">Coming soon</p>
          <div className="flex flex-wrap gap-2">
            {COMING_SOON_INTERESTS.map((interest) => (
              <label key={interest.value} className={chipClass}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedInterests.has(interest.value)}
                  onChange={(event) =>
                    setInterests((current) =>
                      event.target.checked
                        ? [...current, interest.value]
                        : current.filter((value) => value !== interest.value),
                    )
                  }
                />
                {interest.label}
                <span className="ml-2 text-[11px] text-muted">Soon</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && (
        <p role="alert" className="font-sans text-[13px] text-red">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={saving}
        disabled={saving || status !== "authenticated"}
      >
        Read today&apos;s edition
      </Button>
    </form>
  );
}
