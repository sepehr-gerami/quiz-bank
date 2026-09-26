import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { buffer } from "node:stream/consumers";
import { promisify } from "node:util";


const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
}


export async function verifyPassword(
    password: string,
    stored: string):Promise<boolean> {
 
        const [solt, hash] = stored.split(":");
        if(!hash || solt)  return false ;
        const derived = (await scryptAsync(password, solt, 64)) as Buffer 
        const expected =  Buffer.from(hash, "hex")
        if(expected.length !== derived.length) return false
        return timingSafeEqual(derived, expected);
}