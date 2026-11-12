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

export interface UserWithPassword extends User{
    passwordHash: string
}

interface UserRow{
    id: string,
    name: string,
    phone: string,
    password_hash: string
    role: UserRole,
    active: boolean,
    created_at: Date
};

function toUser(row: UserRow): User {
    return{
        id: row.id,
        name: row.name,
        phone: row.phone,
        role: row.role,
        active: row.active,
        createdAt: row.created_at
    }
};

export class phoneInUseError extends Error {
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
        if(isPhoneClash(error)) throw new phoneInUseError();
        throw error
    }
};

export async function findUserByphone(phone:string): Promise<UserWithPassword | null> {
    const result = await pool.query<UserRow>("SELECT * FROM users WHERE phone = $1", [phone]);
    const row = result.rows[0];
    return row ? {...toUser(row), passwordHash: row.password_hash} : null;
}