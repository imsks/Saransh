import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import { submitOnboarding } from "@/app/onboarding/actions";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { track } from "@/lib/analytics";
import type { Question } from "@/lib/server-api";

const mockUpdate = jest.fn();
const mockReplace = jest.fn();

jest.mock("next-auth/react", () => ({ useSession: () => ({ update: mockUpdate }) }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@/app/onboarding/actions", () => ({ submitOnboarding: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const mockedSubmit = submitOnboarding as jest.MockedFunction<typeof submitOnboarding>;

const QUESTIONS: Question[] = [
  { key: "state", label: "State", kind: "single", required: true, options: ["Bihar", "Kerala"] },
  { key: "city", label: "City", kind: "text", required: false, options: [] },
  {
    key: "topics_of_interest",
    label: "Topics of interest",
    kind: "multi",
    required: false,
    options: ["Economy", "Education"],
  },
];

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("OnboardingForm", () => {
  it("asks only the questions it is given, marking optional ones", () => {
    render(<OnboardingForm questions={QUESTIONS.slice(1)} />);

    expect(screen.queryByLabelText(/State/)).toBeNull();
    expect(screen.getByLabelText("City")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Topics of interest (optional)" })).toBeTruthy();
  });

  it("submits the answers, records completion and lands on stories", async () => {
    mockedSubmit.mockResolvedValueOnce({});
    render(<OnboardingForm questions={QUESTIONS} />);

    fireEvent.change(screen.getByLabelText(/State/), { target: { value: "Bihar" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Patna" } });
    fireEvent.click(screen.getByLabelText("Economy"));
    fireEvent.click(screen.getByLabelText("Education"));
    fireEvent.click(screen.getByLabelText("Education"));
    fireEvent.click(screen.getByRole("button", { name: "Continue to stories" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/stories"));
    expect(mockedSubmit).toHaveBeenCalledWith({
      state: "Bihar",
      city: "Patna",
      topics_of_interest: ["Economy"],
    });
    expect(track).toHaveBeenCalledWith("onboarding_completed", { asked: 3 });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("shows the API's error and stays on the form", async () => {
    mockedSubmit.mockResolvedValueOnce({ error: "state is required" });
    render(<OnboardingForm questions={QUESTIONS} />);

    fireEvent.submit(screen.getByRole("button", { name: "Continue to stories" }));

    expect((await screen.findByRole("alert")).textContent).toBe("state is required");
    expect(mockReplace).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("moves straight on when nothing is left to ask", async () => {
    render(<OnboardingForm questions={[]} />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/stories"));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockedSubmit).not.toHaveBeenCalled();
  });
});
