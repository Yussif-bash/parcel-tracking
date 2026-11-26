import { pool } from "../db.ts";
import type { CreateUserInput, UserRole } from "./users-schema.ts";

export interface User {
    id: string,
    name: string,
    phone: string,
    role: UserRole,
    active: boolean,
    createdAt: Date
}

export interface Driver {
    id: string;
    name: string;
    phone: string;
}

export interface UserWithPassword extends User{
    passwordHash: string,
    lockSecondsLeft: number
}

interface UserLoginRow extends UserRow{
    lock_seconds_left: number
}
export interface UserRow{
    id: string,
    name: string,
    phone: string,
    password_hash: string
    role: UserRole,
    active: boolean,
    created_at: Date
};

export function toUser(row: UserRow): User {
    return{
        id: row.id,
        name: row.name,
        phone: row.phone,
        role: row.role,
        active: row.active,
        createdAt: row.created_at
    }
};

export class PhoneInUseError extends Error {
    constructor() {
        super("A user with this phone number already exists");
    }
};

function isPhoneClash(error: unknown){
    return(
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505" &&
        "constraint" in error &&
        error.constraint === "users_phone_key"
    )
};

export async function createUser(input:CreateUserInput, passwordHash: string): Promise<User> {
    try {
        const result = await pool.query<UserRow>(
            `
            INSERT INTO users (name, phone, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [input.name, input.phone, passwordHash, input.role]
        )

        return toUser(result.rows[0]!)
    } catch (error) {
        if(isPhoneClash(error)) throw new PhoneInUseError();
        throw error
    }
};

export async function findUserByPhone(phone:string): Promise<UserWithPassword | null> {
    const result = await pool.query<UserLoginRow>( `SELECT *,
            COALESCE(GREATEST(0, ceil(extract(epoch FROM (locked_until - now())))), 0)::int
              AS lock_seconds_left
       FROM users
      WHERE phone = $1`, [phone]);
    const row = result.rows[0];
    return row ? {
        ...toUser(row),
         passwordHash: row.password_hash, 
         lockSecondsLeft: row.lock_seconds_left
        } : null;
}

export async function recordFailedLogin(
    userId:string,
    maxAttempt = 5,
    lockMinutes = 15
): Promise<void> {
    await pool.query(`
        UPDATE users
        SET failed_logins = CASE WHEN failed_logins + 1 >= $2::int THEN 0 ELSE failed_logins + 1 END,
            locked_until = CASE WHEN failed_logins + 1 >= $2::int THEN now() + make_interval(mins =>  $3::int) 
                         ELSE locked_until END

        WHERE id = $1`, 
        [userId, maxAttempt, lockMinutes],
    );
};


export async function recordSuccessfulLogin(userId:string) {
    await pool.query(`UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1`, [userId])
}

export async function updatePassword(userId:string, passwordHash: string): Promise<void> {
    await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, passwordHash])
}

/** Active drivers, for the list a cashier picks from when creating a trip. */
export async function listDrivers(): Promise<Driver[]> {
    const result = await pool.query<Driver>(
        `SELECT id, name, phone 
        FROM users 
        WHERE role = 'DRIVER' 
        AND active
        ORDER BY name`
    );
    return result.rows;
}