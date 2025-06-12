import { auth } from "@/auth/auth";
import type { Session } from "next-auth";
import { cache } from "react";
import "server-only";
import { HTTP_CODES, HttpError } from "./error/custom.error";

export const getUser = cache(async (): Promise<Session["user"] | null> => {
  const session = await auth();
  return session?.user ?? null;
});

export const getUserServerActions = cache(
  async (): Promise<Session["user"]> => {
    const session = await auth();
    if (!session?.user) {
      throw new HttpError(
        "User not authenticated",
        401,
        HTTP_CODES.UNAUTHORIZED
      );
    }
    return session.user;
  }
);
