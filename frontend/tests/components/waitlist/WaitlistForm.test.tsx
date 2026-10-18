import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import WaitlistForm from "@/components/waitlist/WaitlistForm";

import { analytics } from "@/lib/analytics";

// Spy on the real client: the form calls it at event time, so every call lands here.
let capture: jest.SpiedFunction<typeof analytics.capture>;
let identify: jest.SpiedFunction<typeof analytics.identify>;

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
  capture = jest.spyOn(analytics, "capture").mockImplementation(() => {});
  identify = jest.spyOn(analytics, "identify").mockImplementation(() => {});
  fetchMock.mockReset();
  global.fetch = fetchMock as typeof fetch;
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  window.sessionStorage.clear();
  delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
});

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
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
    render(<WaitlistForm onSuccess={jest.fn()} />);
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
    render(<WaitlistForm onSuccess={jest.fn()} />);
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
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fill("Priya Sharma", "nope");
    submit();

    expect(document.activeElement).toBe(screen.getByLabelText("EMAIL ADDRESS"));
  });

  it("clears a field's error as soon as that field is edited", () => {
    render(<WaitlistForm onSuccess={jest.fn()} />);
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
    const onSuccess = jest.fn();
    respond(201, { ok: true });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("  Priya Sharma ", " priya@example.com ");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/waitlist$/);
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Priya Sharma",
      email: "priya@example.com",
    });
  });

  it("treats a duplicate signup as success", async () => {
    const onSuccess = jest.fn();
    respond(200, { ok: true, duplicate: true });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("shows a form-level error when the API fails, without blaming a field", async () => {
    const onSuccess = jest.fn();
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
    return capture.mock.calls
      .filter(([name]) => name === event)
      .map(([, properties]) => properties);
  }

  /** An IntersectionObserver the test drives by hand. */
  function stubIntersectionObserver() {
    const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    (window as { IntersectionObserver?: unknown }).IntersectionObserver = class {
      constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
    };
    return (isIntersecting: boolean) =>
      observers.forEach((notify) => notify([{ isIntersecting }]));
  }

  it("reports the form as viewed only once it scrolls into view", () => {
    const intersect = stubIntersectionObserver();
    render(<WaitlistForm onSuccess={jest.fn()} />);

    intersect(false);
    expect(captured("waitlist_form_viewed")).toEqual([]);

    intersect(true);
    expect(captured("waitlist_form_viewed")).toEqual([{}]);
  });

  it("reports the first field touched, once per session", () => {
    render(<WaitlistForm onSuccess={jest.fn()} />);

    fireEvent.focus(screen.getByLabelText("EMAIL ADDRESS"));
    fireEvent.focus(screen.getByLabelText("NAME"));
    cleanup();
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("NAME"));

    expect(captured("waitlist_form_started")).toEqual([{ field: "email" }]);
  });

  it("does not report a client-side validation error as a submission", () => {
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fill("Priya Sharma", "not-an-email");
    submit();

    expect(captured("waitlist_submitted")).toEqual([]);
  });

  it("reports a new signup and identifies the Visitor by its Signup Token", async () => {
    const onSuccess = jest.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "created" }]);
    expect(identify).toHaveBeenCalledTimes(1);
    expect(identify.mock.calls[0]).toEqual([TOKEN]);
  });

  it("reports a re-submitted email as a duplicate, under the same Token", async () => {
    const onSuccess = jest.fn();
    respond(200, { ok: true, duplicate: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "duplicate" }]);
    expect(identify.mock.calls[0]).toEqual([TOKEN]);
  });

  it("reports a backend failure with its status, and identifies no one", async () => {
    respond(500, { detail: "Unable to save your waitlist signup right now." });
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await screen.findByText("Something went wrong. Please try again.");
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "failed", status: 500 }]);
    expect(identify).not.toHaveBeenCalled();
  });

  it("reports a 2xx response that is not a signup as a failure", async () => {
    respond(202, {});
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await screen.findByText("Something went wrong. Please try again.");
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "failed", status: 202 }]);
  });

  it("still reports the first interaction when the browser refuses storage", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    render(<WaitlistForm onSuccess={jest.fn()} />);

    fireEvent.focus(screen.getByLabelText("NAME"));

    expect(captured("waitlist_form_started")).toEqual([{ field: "name" }]);
  });

  it("reports a network failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<WaitlistForm onSuccess={jest.fn()} />);
    fill("Priya Sharma", "priya@example.com");
    submit();

    await screen.findByText("Something went wrong. Please try again.");
    expect(captured("waitlist_submitted")).toEqual([{ outcome: "failed" }]);
  });

  it("never sends the name or email to analytics", async () => {
    const onSuccess = jest.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.focus(screen.getByLabelText("NAME"));
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const sent = JSON.stringify([
      capture.mock.calls,
      identify.mock.calls,
    ]);
    expect(sent).not.toContain("priya");
    expect(sent).not.toContain("Priya");
  });

  it("completes the signup even when analytics throws", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    capture.mockImplementation(() => {
      throw new Error("analytics down");
    });
    identify.mockImplementation(() => {
      throw new Error("analytics down");
    });
    const onSuccess = jest.fn();
    respond(201, { ok: true, signup_token: TOKEN });
    render(<WaitlistForm onSuccess={onSuccess} />);
    fireEvent.focus(screen.getByLabelText("NAME"));
    fill("Priya Sharma", "priya@example.com");
    submit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Something went wrong. Please try again.")).toBeNull();
  });
});
