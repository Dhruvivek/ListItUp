import type { PrismaClient } from "@/generated/prisma/client";

export type ProfilePageData = {
  name: string;
  image: string | null;
  aboutMe: string | null;
};

// Kept separate from the page component itself, and taking an injected
// PrismaClient rather than importing the app's shared singleton, so this
// can be exercised directly in a smoke test without a real Next.js request
// scope (headers()/session lookup lives only in page.tsx) and without
// lib/prisma.ts's server-only guard, which throws under plain tsx
// execution (see Architecture.md).
export async function loadProfilePageData(
  database: PrismaClient,
  userId: string
): Promise<ProfilePageData | null> {
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, aboutMe: true },
  });

  return user;
}
