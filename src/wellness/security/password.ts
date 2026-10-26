import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash password menggunakan bcrypt dengan cost factor 12 (standar industri).
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Verifikasi password dengan perlindungan timing attack.
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
