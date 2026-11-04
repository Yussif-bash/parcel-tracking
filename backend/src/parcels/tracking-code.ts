import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const length = 6;

export function generateTrackingCode():string {

    let code = "";

    for (let i = 0; i < length; i++){
        code += ALPHABET.charAt(randomInt(ALPHABET.length))
    }

    return `PT-${code}`
}