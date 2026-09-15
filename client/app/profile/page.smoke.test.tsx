import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { loadProfilePageData } from "./page-data";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log("profile page smoke test skipped: DATABASE_URL is not set");
    return;
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("@/generated/prisma/client"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const createdUserIds: string[] = [];

  try {
    // A signed-in User sees their own avatar, Display Name, and About Me —
    // never another User's data, since loadProfilePageData is always
    // scoped to the session's own user id (enforced by page.tsx's caller,
    // requireAuthenticatedSession, which needs a real Next.js request scope
    // and so isn't exercised directly here — see protected-route.test.ts /
    // protected-route.integration.test.ts for that redirect behavior).
    {
      const userId = randomUUID();
      createdUserIds.push(userId);
      await prisma.user.create({
        data: {
          id: userId,
          name: "Maya Torres",
          email: `profile-page-${userId}@example.test`,
          image: "https://example.test/avatar.png",
          aboutMe: "Building calm, practical tools.",
        },
      });

      const data = await loadProfilePageData(prisma, userId);

      assert.ok(data, "expected page data for a signed-in User");
      assert.equal(data!.name, "Maya Torres");
      assert.equal(data!.image, "https://example.test/avatar.png");
      assert.equal(data!.aboutMe, "Building calm, practical tools.");
    }

    // A User id that does not resolve to a real User (the state page.tsx
    // treats as denied, rendering notFound()) gets no page data at all.
    {
      const data = await loadProfilePageData(prisma, randomUUID());
      assert.equal(data, null);
    }
  } finally {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  }

  console.log("profile page smoke test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
