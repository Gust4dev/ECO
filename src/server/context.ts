import { prisma } from "@/lib/prisma";

export async function createContext(opts?: { req: Request }) {
  const userId = opts?.req.headers.get("x-user-id") ?? null;

  return {
    prisma,
    userId,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;