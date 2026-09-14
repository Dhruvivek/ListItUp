import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  INBOX_LIST_NAME,
  PERSONAL_SPACE_NAME,
} from "@/lib/auth/auth-config";
import { provisionPersonalWorkspace } from "./workspace-provisioning";

async function run() {
  if (!process.env.DATABASE_URL) {
    console.log(
      "workspace provisioning integration test skipped: DATABASE_URL is not set"
    );
    return;
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg"),
    import("@/generated/prisma/client"),
  ]);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const userId = randomUUID();
  const email = `workspace-provisioning-${userId}@example.test`;

  async function personalWorkspacesFor(id: string) {
    return prisma.workspace.findMany({
      where: { kind: "PERSONAL", members: { some: { userId: id } } },
      include: { lists: true, members: true },
    });
  }

  try {
    const unverifiedUser = await prisma.user.create({
      data: {
        id: userId,
        name: "Provisioning test user",
        email,
        emailVerified: false,
      },
    });

    await provisionPersonalWorkspace(prisma, unverifiedUser.id);
    assert.deepEqual(
      await personalWorkspacesFor(unverifiedUser.id),
      [],
      "an unverified user must not receive a Personal Space"
    );

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    await provisionPersonalWorkspace(prisma, userId);
    await provisionPersonalWorkspace(prisma, userId);

    const workspaces = await personalWorkspacesFor(userId);

    assert.equal(
      workspaces.length,
      1,
      "provisioning twice must not create a second Personal Space"
    );
    assert.equal(workspaces[0].name, PERSONAL_SPACE_NAME);
    assert.equal(workspaces[0].lists.length, 1);
    assert.equal(workspaces[0].lists[0].name, INBOX_LIST_NAME);
    assert.equal(workspaces[0].lists[0].isInbox, true);
    assert.equal(workspaces[0].members.length, 1);
    assert.equal(workspaces[0].members[0].role, "OWNER");

    const sharedWorkspacesContainingUser = await prisma.workspace.findMany({
      where: { kind: "SHARED", members: { some: { userId } } },
    });
    assert.deepEqual(
      sharedWorkspacesContainingUser,
      [],
      "a Personal Space must never be returned by a query listing shared Workspaces"
    );
  } finally {
    const workspaceIds = (await personalWorkspacesFor(userId)).map((w) => w.id);
    await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  }

  console.log("workspace provisioning integration test passed");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
