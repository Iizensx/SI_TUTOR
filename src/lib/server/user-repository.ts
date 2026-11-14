import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { UserProfile } from "@/lib/auth-types";

type StoredUser = UserProfile & { passwordHash: string };
type UserFile = { schemaVersion: number; users: StoredUser[] };
const deriveKey = promisify(scrypt);
const usersPath = path.join(process.cwd(), "TestData", "users.json");
// One local Node process only. Replace this repository with a database for deployment.
const state = globalThis as typeof globalThis & { siTutorUserWrites?: Promise<unknown> };

export class AuthError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function readUsers(): Promise<UserFile> {
  return JSON.parse(await readFile(usersPath, "utf8"));
}

function publicProfile(user: StoredUser): UserProfile {
  const { passwordHash, ...profile } = user;
  void passwordHash;
  return profile;
}

async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function findUser(id: string) {
  const user = (await readUsers()).users.find((user) => user.id === id);
  return user ? publicProfile(user) : null;
}

export async function authenticateUser(email: string, password: string) {
  const user = (await readUsers()).users.find((user) => user.email.toLowerCase() === email);
  // Derive a key for unknown emails too, so both paths do comparable work.
  const [salt, hash] = user?.passwordHash.split(":") ?? ["00000000000000000000000000000000", "00".repeat(64)];
  const actual = await deriveKey(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, "hex");
  if (!user || expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
    throw new AuthError("The email or password is incorrect. Please try again.", 401);
  }
  return publicProfile(user);
}

export async function createUser(input: Pick<UserProfile, "firstName" | "lastName" | "email" | "level"> & { password: string }) {
  const hash = await passwordHash(input.password);
  const operation = (state.siTutorUserWrites ?? Promise.resolve()).then(async () => {
    const data = await readUsers();
    if (data.users.some((user) => user.email.toLowerCase() === input.email)) {
      throw new AuthError("An account with this email already exists. Please log in instead.", 409);
    }
    const user: StoredUser = {
      id: randomUUID(), firstName: input.firstName, lastName: input.lastName,
      email: input.email, passwordHash: hash, role: "student", level: input.level,
      country: "", learningGoal: "", interests: [], createdAt: new Date().toISOString(), enrollments: [],
    };
    data.users.push(user);
    const temporaryPath = `${usersPath}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(data, null, 2) + "\n", "utf8");
    await rename(temporaryPath, usersPath);
    return publicProfile(user);
  });
  state.siTutorUserWrites = operation.catch(() => undefined);
  return operation;
}
