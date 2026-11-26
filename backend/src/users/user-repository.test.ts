import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { pool } from "../db.ts";
import { PhoneInUseError, createUser, findUserByPhone, listDrivers, recordFailedLogin, recordSuccessfulLogin } from "./user-repository.ts";

const input = {name: "Yussif Bashiru", phone: "0245342452", role: "CASHIER"} as const

beforeEach(async () => {
    await pool.query("TRUNCATE users CASCADE");
});

afterAll(async() => {
    await pool.end();
});

describe("createUser", () => {
    it("saves a user and does not return hashed password", async() => {
        const user = await createUser(input, "hash-value");
        expect(user.name).toBe("Yussif Bashiru");
        expect(user.role).toBe("CASHIER");
        expect(user.active).toBe(true);
        expect(user).not.toHaveProperty("passwordHash")
    });

    it("refuses second user with the same phone number", async() =>{
        await createUser(input, "hash-value");
        await expect( createUser({...input, name: "Someone Else"}, "hash-value")).rejects.toThrow(PhoneInUseError)
    })
});

describe("findUserByPhone", () => {
    it("finds the user and include the stored hash for the login check", async() => {
        await createUser(input, "hash-value");
        const found = await findUserByPhone("0245342452");
        expect(found?.name).toBe("Yussif Bashiru");
        expect(found?.passwordHash).toBe("hash-value");
    });

    it("returns null when nobody has that phone number", async() => {
        expect(await findUserByPhone("0243768765")).toBeNull();
    });
});


describe("login lockout", () => {
  it("locks the account after five failed logins", async () => {
    const user = await createUser(input, "hash-value");

    for (let i = 0; i < 4; i++) await recordFailedLogin(user.id);
    expect((await findUserByPhone(input.phone))?.lockSecondsLeft).toBe(0);

    await recordFailedLogin(user.id);
    const locked = await findUserByPhone(input.phone);
    expect(locked?.lockSecondsLeft).toBeGreaterThan(14 * 60);
    expect(locked?.lockSecondsLeft).toBeLessThanOrEqual(15 * 60);
  });

  it("starts counting again after a successful login", async () => {
    const user = await createUser(input, "hash-value");

    for (let i = 0; i < 4; i++) await recordFailedLogin(user.id);
    await recordSuccessfulLogin(user.id);
    await recordFailedLogin(user.id);

    expect((await findUserByPhone(input.phone))?.lockSecondsLeft).toBe(0);
  });
});

describe("listDrivers", () => {
    it("lists only active drivers, sorted by name", async() => {
        await createUser({name: "Yaw Driver", phone: "+233200000011", role:"DRIVER"}, "h");
        await createUser({name: "Abena Driver", phone: "+233200000012", role:"DRIVER"}, "h");
        await createUser({name: "Ama Cashier", phone: "+233200000013", role:"CASHIER"}, "h");

        const off = await createUser({name: "Off Driver", phone:  "+233200000014", role:"DRIVER"}, "h");
        await pool.query("UPDATE users SET active = false WHERE id = $1", [off.id]);

        expect((await listDrivers()).map((driver) => driver.name)).toEqual([
            "Abena Driver",
            "Yaw Driver"
        ])
    })
})