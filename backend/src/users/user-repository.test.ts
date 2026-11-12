import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { pool } from "../db.ts";
import { phoneInUseError, createUser, findUserByphone } from "./user-repository.ts";

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
        await expect( createUser({...input, name: "Someone Else"}, "hash-value")).rejects.toThrow(phoneInUseError)
    })
});

describe("findUserByPhone", () => {
    it("finds the user and include the stored hash for the login check", async() => {
        await createUser(input, "hash-value");
        const found = await findUserByphone("0245342452");
        expect(found?.name).toBe("Yussif Bashiru");
        expect(found?.passwordHash).toBe("hash-value");
    });

    it("returns null when nobody has that phone number", async() => {
        expect(await findUserByphone("0243768765")).toBeNull();
    });
})