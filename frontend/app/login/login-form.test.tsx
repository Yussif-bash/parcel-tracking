import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Phone number"), "0241234567");
  await user.type(screen.getByLabelText("Password"), "my-password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("sends the phone and password to the login route", async () => {
    reply(200, { name: "Ama" });
    render(<LoginForm />);
    await fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse(options.body)).toEqual({ phone: "0241234567", password: "my-password" });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the backend's message when the password is wrong", async () => {
    reply(401, { error: "Wrong phone number or password" });
    render(<LoginForm />);
    await fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Wrong phone number or password",
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the first validation message for a 400", async () => {
    reply(400, {
      error: "Invalid login",
      details: [{ field: "phone", message: "Enter a phone number like 0241234567" }],
    });
    render(<LoginForm />);
    await fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toContain("Enter a phone number");
  });

  it("explains when the server cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    render(<LoginForm />);
    await fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toContain("Could not reach the server");
  });

  it("reveals and hides the password", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    const field = screen.getByLabelText("Password") as HTMLInputElement;
    expect(field.type).toBe("password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(field.type).toBe("text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field.type).toBe("password");
  });
});