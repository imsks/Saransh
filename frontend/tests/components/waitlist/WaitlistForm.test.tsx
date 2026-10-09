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

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
