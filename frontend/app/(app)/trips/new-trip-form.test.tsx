import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NewTripForm } from "./new-trip-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const fetchMock = vi.fn();
const drivers = [{ id: "driver-1", name: "Kwame Driver", phone: "+233200000001" }];

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

describe("NewTripForm", () => {
  it("sends the chosen driver, vehicle and destination, then refreshes the page", async () => {
    reply(201, { id: "trip-1" });
    render(<NewTripForm drivers={drivers} />);

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Driver"), "driver-1");
    await user.type(screen.getByLabelText("Vehicle number"), "GR-1234-22");
    await user.type(screen.getByLabelText("Destination"), "Kumasi");
    await user.click(screen.getByRole("button", { name: "Create trip" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/trips");
    expect(JSON.parse(options.body)).toEqual({
      driverId: "driver-1",
      vehicleNumber: "GR-1234-22",
      destination: "Kumasi",
    });
  });

  it("shows the backend's message under each field it rejects", async () => {
    reply(400, {
      details: [
        { field: "driverId", message: "Choose a driver" },
        { field: "destination", message: "Destination is required" },
      ],
    });
    render(<NewTripForm drivers={drivers} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Create trip" }));

    expect(await screen.findByText("Choose a driver", { selector: "p" })).toBeTruthy();
    expect(screen.getByText("Destination is required")).toBeTruthy();
    expect(screen.getByLabelText("Driver").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("Vehicle number").getAttribute("aria-invalid")).toBeNull();
  });

  it("explains when there are no drivers, instead of showing the form", () => {
    render(<NewTripForm drivers={[]} />);

    expect(screen.getByText(/no drivers yet/i)).toBeTruthy();
    expect(screen.queryByLabelText("Vehicle number")).toBeNull();
  });
});