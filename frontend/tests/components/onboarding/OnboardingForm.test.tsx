import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import { submitOnboarding } from "@/app/onboarding/actions";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { POPULAR_STATES } from "@/constants/onboarding";
import { track } from "@/lib/analytics";
import type { OnboardingField } from "@/lib/server-api";

const mockUpdate = jest.fn();
const mockReplace = jest.fn();
let mockStatus: "authenticated" | "loading" | "unauthenticated" = "authenticated";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ update: mockUpdate, status: mockStatus }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock("@/app/onboarding/actions", () => ({ submitOnboarding: jest.fn() }));
jest.mock("@/lib/analytics", () => ({ track: jest.fn() }));

const mockedSubmit = submitOnboarding as jest.MockedFunction<typeof submitOnboarding>;
const ALL: OnboardingField[] = ["name", "state", "topics"];

function fillName(value = "Priya Sharma") {
  fireEvent.change(screen.getByLabelText(/Name/), { target: { value } });
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockStatus = "authenticated";
});

describe("OnboardingForm", () => {
  it("asks every missing question, with popular states first", () => {
    render(<OnboardingForm missingFields={ALL} />);

    expect(screen.getByLabelText(/Name/)).toHaveProperty("value", "");
    expect(screen.getByRole("radiogroup", { name: "State" })).toBeTruthy();
    expect(screen.getByLabelText("Civic")).toBeTruthy();
    expect(screen.getAllByRole("radio").slice(0, 8).map((radio) => radio.getAttribute("value"))).toEqual(
      POPULAR_STATES,
    );
  });

  it("filters states by search", () => {
    render(<OnboardingForm missingFields={ALL} />);

    expect(screen.getAllByRole("radio").every((radio) => !radio.matches(":checked"))).toBe(true);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Kera" } });

    expect(screen.getByRole("radio", { name: "Kerala" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Bihar" })).toBeNull();
  });

  it("asks a Rajniti User only for Saransh topics and submits only those", async () => {
    mockedSubmit.mockResolvedValueOnce({});
    mockUpdate.mockResolvedValueOnce({ user: { id: "google-1" } });
    render(<OnboardingForm missingFields={["topics"]} />);

    expect(screen.queryByLabelText(/Name/)).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "State" })).toBeNull();
    fireEvent.click(screen.getByLabelText("Civic"));
    fireEvent.click(screen.getByRole("button", { name: "Read today's edition" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/stories"));
    expect(mockedSubmit).toHaveBeenCalledWith({
      topics: ["civic"],
      coming_soon_interests: [],
    });
  });

  it("requires a name when it is missing", () => {
    render(<OnboardingForm missingFields={ALL} />);
    const form = document.querySelector("form");

    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    expect(screen.getByRole("alert").textContent).toBe("Name is required.");
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("requires a state before saving", () => {
    render(<OnboardingForm missingFields={ALL} />);
    fillName();
    const form = document.querySelector("form");

    expect(form).not.toBeNull();
    if (form) fireEvent.submit(form);

    expect(screen.getByRole("alert").textContent).toBe("State is required.");
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("blocks selection of a fourth topic", () => {
    render(<OnboardingForm missingFields={ALL} />);

    fireEvent.click(screen.getByLabelText("Civic"));
    fireEvent.click(screen.getByLabelText("Politics"));
    fireEvent.click(screen.getByLabelText("Education"));
    fireEvent.click(screen.getByLabelText("Crime"));

    expect(screen.getByRole("alert").textContent).toBe("Choose up to 3 topics.");
    expect(screen.getByLabelText("Crime")).toHaveProperty("checked", false);
  });

  it("submits preferences, records privacy-safe completion properties, refreshes and opens stories", async () => {
    mockedSubmit.mockResolvedValueOnce({});
    mockUpdate.mockResolvedValueOnce({ user: { id: "google-1" } });
    render(<OnboardingForm missingFields={ALL} />);

    fillName();
    fireEvent.click(screen.getByRole("radio", { name: "Bihar" }));
    fireEvent.click(screen.getByLabelText("Civic"));
    fireEvent.click(screen.getByLabelText("Education"));
    fireEvent.click(screen.getByLabelText(/Entertainment/));
    fireEvent.click(screen.getByRole("button", { name: "Read today's edition" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/stories"));
    expect(mockedSubmit).toHaveBeenCalledWith({
      name: "Priya Sharma",
      state: "Bihar",
      topics: ["civic", "education"],
      coming_soon_interests: ["entertainment"],
    });
    expect(track).toHaveBeenCalledWith("onboarding_completed", {
      name_asked: true,
      state_asked: true,
      topic_count: 2,
    });
    expect(mockUpdate).toHaveBeenCalledWith({});
  });

  it("keeps answers available when the API rejects the save", async () => {
    mockedSubmit.mockResolvedValueOnce({ error: "state is required" });
    render(<OnboardingForm missingFields={ALL} />);
    fillName();
    fireEvent.click(screen.getByRole("radio", { name: "Bihar" }));
    fireEvent.click(screen.getByLabelText("Politics"));
    fireEvent.click(screen.getByRole("button", { name: "Read today's edition" }));

    expect((await screen.findByRole("alert")).textContent).toBe("state is required");
    expect(screen.getByLabelText(/Name/)).toHaveProperty("value", "Priya Sharma");
    expect(screen.getByRole("radio", { name: "Bihar" })).toHaveProperty("checked", true);
    expect(screen.getByLabelText("Politics")).toHaveProperty("checked", true);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it("shows a retryable error and clears saving when the save rejects", async () => {
    mockedSubmit.mockRejectedValueOnce(new Error("network unavailable"));
    render(<OnboardingForm missingFields={ALL} />);
    fillName();
    fireEvent.click(screen.getByRole("radio", { name: "Bihar" }));

    fireEvent.click(screen.getByRole("button", { name: "Read today's edition" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Something went wrong. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Read today's edition" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByLabelText(/Name/)).toHaveProperty("value", "Priya Sharma");
  });

  it("waits for an authenticated session before allowing submission", async () => {
    mockStatus = "loading";
    mockedSubmit.mockResolvedValueOnce({});
    mockUpdate.mockResolvedValueOnce({ user: { id: "google-1" } });
    const { rerender } = render(<OnboardingForm missingFields={["topics"]} />);
    const submit = screen.getByRole("button", { name: "Read today's edition" });

    expect(submit).toHaveProperty("disabled", true);
    expect(mockedSubmit).not.toHaveBeenCalled();

    mockStatus = "authenticated";
    rerender(<OnboardingForm missingFields={["topics"]} />);
    expect(submit).toHaveProperty("disabled", false);
    fireEvent.click(submit);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/stories"));
    expect(mockUpdate).toHaveBeenCalledWith({});
  });
});
