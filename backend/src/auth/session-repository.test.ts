import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { pool } from "../db.ts";
import { createUser } from "../users/user-repository.ts";
import { 
    createSession,
    deleteSession, 
    deleteSessionForUser,
    findUserBySessionToken 
} from "./session-repository.ts";

let userId: string;

beforeEach(async() => {
    await pool.query("TRUNCATE users CASCADE");
    const user = await createUser(
        {name: "Yussif Bashiru", phone: "0545519634", role: "CASHIER"}, 
        "hash-value"
    );
    userId = user.id
});

afterAll(async() =>{
    await pool.end();
});


describe("sessions", () => {
    it("finds the user for a valid token and never stores the token itself", async() => {
        const { token } = await createSession(userId);

        const user = await findUserBySessionToken(token);
        expect(user?.name).toBe("Yussif Bashiru");
        expect(user?.role).toBe("CASHIER");

        const stored = await pool.query<{token_hash: string}>("SELECT token_hash FROM sessions");
        expect(stored.rows[0]!.token_hash).not.toBe(token)
    });

    it("returns null for unkown token", async() => {
        expect(await findUserBySessionToken("not-a-real-token")).toBeNull()
    });

    it("returns null once the token has expired", async () => {
        const { token } = await createSession(userId, -1);

        expect(await findUserBySessionToken(token)).toBeNull()
    });

    it("returns null when the user has been switched off", async() => {
        const { token } = await createSession(userId);
        await pool.query("UPDATE users SET active = false WHERE id = $1", [userId]);

        expect(await findUserBySessionToken(token)).toBeNull()
    });

    it("logout one session", async() => {
        const { token } = await createSession(userId);
        await deleteSession(token);
        expect(await findUserBySessionToken(token)).toBeNull();
    });

    it("logs a user out everywhere without touching other users", async() => {
        const other = await createUser({name: "Kojo Boateng", phone: "0208999290", role: "CASHIER"}, "hash-value");
        const first = await createSession(userId);
        const second = await createSession(userId);
        const otherSession = await createSession(other.id);

        await deleteSessionForUser(userId);

        expect(await findUserBySessionToken(first.token)).toBeNull();
        expect(await findUserBySessionToken(second.token)).toBeNull();
        expect(await findUserBySessionToken(otherSession.token)).not.toBeNull()
    })
})
