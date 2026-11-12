import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db.ts";
import { startTestServer } from "../test-helper.ts";
import { createUser } from "../users/user-repository.ts";
import { hashPassword } from "./password.ts";
import { findUserBySessionToken } from "./session-repository.ts";

let baseUrl: string;
let closeServer: () => void;

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
  closeServer = server.close;
});

beforeEach(async () => {
  await pool.query("TRUNCATE users CASCADE");
  await createUser(
    { name: "Ama Mensah", phone: "+233241234567", role: "CASHIER" },
    await hashPassword("correct-password"),
  );
});

afterAll(async () => {
  closeServer;
  await pool.end();
});

function login(body: unknown) {
  return fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sessionCookieFrom(response: Response): string | undefined {
  return response.headers.getSetCookie().find((cookie) => cookie.startsWith("session="));
}

function tokenFrom(response: Response): string {
  return sessionCookieFrom(response)!.split(";")[0]!.slice("session=".length);
}

describe("POST /auth/login", () => {
  it("logs in with the right password, even when the phone is typed locally", async () => {
    const response = await login({ phone: "0241234567", password: "correct-password" });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.name).toBe("Ama Mensah");
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("sets a safe session cookie that identifies the user", async () => {
    const response = await login({ phone: "0241234567", password: "correct-password" });
    const cookie = sessionCookieFrom(response)!;

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");

    const user = await findUserBySessionToken(tokenFrom(response));
    expect(user?.phone).toBe("+233241234567");
  });

  it("rejects a wrong password and sets no cookie", async () => {
    const response = await login({ phone: "0241234567", password: "wrong-password" });
    expect(response.status).toBe(401);
    expect(sessionCookieFrom(response)).toBeUndefined();
  });

  it("gives the same answer for an unknown phone number as for a wrong password", async () => {
    const wrongPassword = await login({ phone: "0241234567", password: "wrong-password" });
    const unknownPhone = await login({ phone: "0200000000", password: "wrong-password" });

    expect(unknownPhone.status).toBe(401);
    expect(await unknownPhone.json()).toEqual(await wrongPassword.json());
  });

  it("rejects a switched-off account even with the right password", async () => {
    await pool.query("UPDATE users SET active = false");
    const response = await login({ phone: "0241234567", password: "correct-password" });
    expect(response.status).toBe(401);
  });

  it("returns 400 when the password is missing", async () => {
    const response = await login({ phone: "0241234567" });
    expect(response.status).toBe(400);
  });
});

describe("POST /auth/logout", () => {
  it("ends the session and clears the cookie", async () => {
    const loggedIn = await login({ phone: "0241234567", password: "correct-password" });
    const token = tokenFrom(loggedIn);

    const response = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: { Cookie: `session=${token}` },
    });

    expect(response.status).toBe(204);
    expect(await findUserBySessionToken(token)).toBeNull();
    expect(sessionCookieFrom(response)).toContain("Expires=Thu, 01 Jan 1970");
  });

  it("still succeeds when nobody is logged in", async () => {
    const response = await fetch(`${baseUrl}/auth/logout`, { method: "POST" });
    expect(response.status).toBe(204);
  });
});