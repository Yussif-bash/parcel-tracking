import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterParcelForm } from "./register-parcel-form";

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
  await user.type(screen.getByLabelText("Sender Name"), "Ama Mensah");
  await user.type(screen.getByLabelText("Sender Phone"), "0241234567");
  await user.type(screen.getByLabelText("Receiver Name"), "Kojo Boateng");
  await user.type(screen.getByLabelText("Receiver Phone"), "0201234567");
  await user.type(screen.getByLabelText("Description"), "Box of books");
  await user.click(screen.getByRole("button", { name: "Register parcel" }));
}

describe("RegisterParcelForm", () => {
  it("sends the details, shows the tracking code, and clears the form", async () => {
    reply(201, { trackingCode: "PT-K7M2X9", receiverName: "Kojo Boateng" });
    render(<RegisterParcelForm />);
    await fillAndSubmit();

    expect((await screen.findByRole("status")).textContent).toContain("PT-K7M2X9");

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/parcels");
    expect(JSON.parse(options.body)).toEqual({
      senderName: "Ama Mensah",
      senderPhone: "0241234567",
      receiverName: "Kojo Boateng",
      receiverPhone: "0201234567",
      description: "Box of books",
    });

    expect((screen.getByLabelText("Sender Name") as HTMLInputElement).value).toBe("");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows each field's message and marks the field invalid", async () => {
    reply(400, {
      error: "Invalid parcel",
      details: [
        { field: "senderPhone", message: "Enter a phone number like 0241234567" },
        { field: "description", message: "Description is required" },
      ],
    });
    render(<RegisterParcelForm />);
    await fillAndSubmit();

    expect(await screen.findByText("Enter a phone number like 0241234567")).toBeTruthy();
    expect(screen.getByText("Description is required")).toBeTruthy();
    expect(screen.getByLabelText("Sender Phone").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Receiver Name").getAttribute("aria-invalid")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps what was typed when the server rejects the parcel", async () => {
    reply(400, {
      details: [{ field: "senderPhone", message: "Enter a phone number like 0241234567" }],
    });
    render(<RegisterParcelForm />);
    await fillAndSubmit();

    await screen.findByText("Enter a phone number like 0241234567");
    expect((screen.getByLabelText("Receiver Name") as HTMLInputElement).value).toBe("Kojo Boateng");
  });

  it("sends the person to the login page when the session has ended", async () => {
    reply(401, { error: "Please log in" });
    render(<RegisterParcelForm />);
    await fillAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("explains when the server cannot be reached", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    render(<RegisterParcelForm />);
    await fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toContain("Could not reach the server");
  });
});