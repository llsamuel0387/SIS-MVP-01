import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
/** Absolute path to canonical dev SQLite (prisma/dev.db). */
export const prismaDevDbFile = resolve(root, "prisma", "dev.db");

/** Canonical dev DB URL (always prisma/dev.db), independent of .env DATABASE_URL. */
export const prismaDevDatabaseUrl = pathToFileURL(prismaDevDbFile).href;
export const repoRoot = root;
