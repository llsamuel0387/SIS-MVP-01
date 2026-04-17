import argon2 from "argon2";

export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  if (!hash.startsWith("$argon2")) {
    return false;
  }
  return argon2.verify(hash, plainText);
}
