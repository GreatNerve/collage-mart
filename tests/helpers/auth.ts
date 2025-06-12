import { request, APIRequestContext } from "@playwright/test";
import { Role } from "../types/roles";

const storagePathMap: Record<Role, string> = {
  [Role.ADMIN]: "tests/storage/admin.json",
  [Role.USER]: "tests/storage/user.json",
  [Role.BLOCKED]: "tests/storage/blocked.json",
};

export async function getAuthContext(role: Role): Promise<APIRequestContext> {
  const path = storagePathMap[role];
  return await request.newContext({
    storageState: path,
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  });
}