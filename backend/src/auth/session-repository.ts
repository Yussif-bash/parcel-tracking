import { pool } from "../db.ts";
import { toUser, type User, type UserRow } from "../users/user-repository.ts";
import { hashToken, generateToken } from "./token.ts";

const SESSION_HOURS = 12;

/** Starts a session and returns the token to put in the cookie. Only its hash is stored. */
export async function createSession(
    userId: string,
    lifetimeSeconds = SESSION_HOURS * 60 * 60
): Promise<{token: string, expiresAt: Date}>{
    const token = generateToken();
    const result = await pool.query<{expires_at: Date}>(
        `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES($1, $2, now() + make_interval(secs => $3::double precision))
        RETURNING expires_at
        `,
        [userId, hashToken(token), lifetimeSeconds]
    );

    return {token, expiresAt: result.rows[0]!.expires_at}
};

/** The user behind a session token, or null if it is unknown, expired, or the user is switched off. */
export async function findUserBySessionToken(token: string): Promise<User | null>{

    const result =  await pool.query<UserRow>(
        `
        SELECT u.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1
         AND s.expires_at > now()
         AND u.active
        `,
        [hashToken(token)]
    );

    const row = result.rows[0];
    return row ? toUser(row) : null
    
};

export async function deleteSession(token: string): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashToken(token)])
};

/** Logs a user out everywhere, for example when a phone is lost. */

export async function deleteSessionForUser(userId: string): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId])
}