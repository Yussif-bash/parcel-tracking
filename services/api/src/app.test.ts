import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("api", () => {
  it("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("unknown routes return 404 JSON", async () => {
    const res = await app.request("/nope");
    expect(res.status).toBe(404);
  });
});
