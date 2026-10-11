// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WaitlistForm from "@/components/waitlist/WaitlistForm";

const analytics = vi.hoisted(() => ({ capture: vi.fn(), identify: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ analytics }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  analytics.capture.mockReset();
  analytics.identify.mockReset();
  window.sessionStorage.clear();
});

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

function fill(name: string, email: string) {
  fireEvent.change(screen.getByLabelText("NAME"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("EMAIL ADDRESS"), {
    target: { value: email },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "JOIN THE WAITLIST" }));
}

describe("WaitlistForm", () => {
  it("marks each invalid field and puts its message under it", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);
    submit();

    const name = screen.getByLabelText("NAME");
    const email = screen.getByLabelText("EMAIL ADDRESS");

    expect(name.getAttribute("aria-invalid")).toBe("true");
    expect(email.getAttribute("aria-invalid")).toBe("true");

    const nameError = document.getElementById(
      name.getAttribute("aria-describedby") ?? "",
    );
    const emailError = document.getElementById(
      email.getAttribute("aria-describedby") ?? "",
    );
    expect(nameError?.textContent).toBe("Please enter your real name.");
    expect(emailError?.textContent).toBe("Please enter a valid email address.");
    expect(name.parentElement?.contains(nameError)).toBe(true);
    expect(email.parentElement?.contains(emailError)).toBe(true);
  });

  it("does not call the API while a field is invalid", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fill("Priya Sharma", "not-an-email");
    submit();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("NAME").getAttribute("aria-invalid"),
    ).toBeNull();
    expect(
      screen.getByLabelText("EMAIL ADDRESS").getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("moves focus to the first invalid field", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fill("Priya Sharma", "nope");
    submit();

    expect(document.activeElement).toBe(screen.getByLabelText("EMAIL ADDRESS"));
  });

  it("clears a field's error as soon as that field is edited", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);
    submit();

    fireEvent.change(screen.getByLabelText("NAME"), {
      target: { value: "Priya" },
    });

    expect(
      screen.getByLabelText("NAME").getAttribute("aria-invalid"),
    ).toBeNull();
    expect(screen.queryByText("Please enter your real name.")).toBeNull();
    expect(
      screen.getByText("Please enter a valid email address."),
    ).toBeTruthy();
  });

  it("posts the trimmed signup and reports success", async () => {
    const onSuccess = vi.fn();
    respond(201, { ok: true });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("  Priya Sharma ", " priya@example.com ");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/waitlist$/);
    expect(JSON.parse(init.body)).toEqual({
      name: "Priya Sharma",
      email: "priya@example.com",
    });
  });

  it("treats a duplicate signup as success", async () => {
    const onSuccess = vi.fn();
    respond(200, { ok: true, duplicate: true });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("shows a form-level error when the API fails, without blaming a field", async () => {
    const onSuccess = vi.fn();
    respond(500, { detail: "Unable to save your waitlist signup right now." });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(
      screen.getByLabelText("NAME").getAttribute("aria-invalid"),
    ).toBeNull();
    expect(
      screen.getByLabelText("EMAIL ADDRESS").getAttribute("aria-invalid"),
    ).toBeNull();
  });
});

describe("WaitlistForm analytics", () => {
  const TOKEN = "3f2b8a52-7c1d-4e0b-9a77-1f5e2c9d4b10";

  function captured(event: string) {
    return analytics.capture.mock.calls
      .filter(([name]) => name === event)
      .map(([, properties]) => properties);
  }

  /** An IntersectionObserver the test drives by hand. */
  function stubIntersectionObserver() {
    const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          observers.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    return (isIntersecting: boolean) =>
      observers.forEach((notify) => notify([{ isIntersecting }]));
  }

  it("reports the form as viewed only once it scrolls into view", () => {
    const intersect = stubIntersectionObserver();
    render(<WaitlistForm onSuccess={vi.fn()} />);

    intersect(false);
    expect(captured("waitlist_form_viewed")).toEqual([]);

    intersect(true);
    expect(captured("waitlist_form_viewed")).toEqual([{}]);
  });

  it("reports the first field touched, once per session", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);

    fireEvent.focus(screen.getByLabelText("EMAIL ADDRESS"));
    fireEvent.focus(screen.getByLabelText("NAME"));
    cleanup();
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fireEvent.focus(screen.getByLabelText("NAME"));

    expect(captured("waitlist_form_started")).toEqual([{ field: "email" }]);
  });

  it("does not report a client-side validation error as a submission", () => {
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fill("Priya Sharma", "not-an-email");
    submit();

    expect(captured("waitlist_submitted")).toEqual([]);
  });

  it("reports a new signup and identifies the Visitor by its Signup Token", async () => {
    const onSuccess = vi.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "created" }]);
    expect(analytics.identify).toHaveBeenCalledTimes(1);
    expect(analytics.identify.mock.calls[0]).toEqual([TOKEN]);
  });

  it("reports a re-submitted email as a duplicate, under the same Token", async () => {
    const onSuccess = vi.fn();
    respond(200, { ok: true, duplicate: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "duplicate" }]);
    expect(analytics.identify.mock.calls[0]).toEqual([TOKEN]);
  });

  it("reports a backend failure with its status, and identifies no one", async () => {
    respond(500, { detail: "Unable to save your waitlist signup right now." });
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await screen.findByText("Something went wrong. Please try again.");
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "failed", status: 500 }]);
    expect(analytics.identify).not.toHaveBeenCalled();
  });

  it("reports a network failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<WaitlistForm onSuccess={vi.fn()} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await screen.findByText("Something went wrong. Please try again.");
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "failed" }]);
  });

  it("never sends the name or email to analytics", async () => {
    const onSuccess = vi.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.focus(screen.getByLabelText("NAME"));
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const sent = JSON.stringify([
      analytics.capture.mock.calls,
      analytics.identify.mock.calls,
    ]);
    expect(sent).not.toContain("priya");
    expect(sent).not.toContain("Priya");
  });

  it("completes the signup even when analytics throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    analytics.capture.mockImplementation(() => {
      throw new Error("analytics down");
    });
    analytics.identify.mockImplementation(() => {
      throw new Error("analytics down");
    });
    const onSuccess = vi.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.focus(screen.getByLabelText("NAME"));
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Something went wrong. Please try again.")).toBeNull();
  });
});
