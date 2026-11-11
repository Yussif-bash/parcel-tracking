import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const argon2Async = promisify(argon2);

const MEMORY_KIB = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;
const SALT_LENGTH = 16;

function derive(
    password: string, 
    salt: Buffer, 
    memory: number,
    passes: number,
    parallelism: number,
): Promise<Buffer>{
    return argon2Async("argon2id", {
        message: password,
        nonce: salt,
        memory,
        passes,
        parallelism,
        tagLength: TAG_LENGTH
    })
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const hash = await derive(password, salt, MEMORY_KIB, PASSES, PARALLELISM);
    return [
        "argon2id",
        `m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}`,
        salt.toString("base64"),
        hash.toString("base64")
    ].join("$")
}

export async function verifyPassword(password: string, stored: string) {
   try {
     const [algorithm, settings, saltText, hashText] = stored.split("$");
     const match = settings?.match(/^m=(\d+),t=(\d+),p=(\d+)$/);

    if(algorithm !== "argon2id" || !match || !saltText || !hashText) {      
        return false
    }; 

    const expected = Buffer.from(hashText, "base64");
    const actual = await  derive(
        password,
        Buffer.from(saltText, "base64"),
        Number(match[1]), 
        Number(match[2]),
        Number(match[3])
    );

    return actual.length === expected.length && timingSafeEqual(actual, expected);
   } catch {        
    return false
   }
}