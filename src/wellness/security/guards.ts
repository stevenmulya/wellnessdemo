import { getWellnessSession } from "./session";

export class WellnessAuthError extends Error {
  constructor(message: string = "Silakan login terlebih dahulu.") {
    super(message);
    this.name = "WellnessAuthError";
  }
}

export class WellnessForbiddenError extends Error {
  constructor(message: string = "Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.") {
    super(message);
    this.name = "WellnessForbiddenError";
  }
}

/**
 * Guard untuk memastikan pemanggil adalah user yang telah login dan berstatus aktif.
 */
export async function requireAuth() {
  const session = await getWellnessSession();
  if (!session) {
    throw new WellnessAuthError();
  }
  return session;
}

/**
 * Guard untuk memastikan pemanggil memiliki role SUPERADMIN.
 */
export async function requireSuperadmin() {
  const session = await requireAuth();
  if (session.role !== "SUPERADMIN") {
    throw new WellnessForbiddenError("Akses khusus Superadmin.");
  }
  return session;
}
