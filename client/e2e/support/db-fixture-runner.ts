import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import type { InvitableWorkspaceRole } from "@/lib/workspace/workspace-invitations";

// Runs as a `tsx` child process rather than being imported into a Playwright
// test file directly: the generated Prisma client is ESM, and Playwright's
// own TypeScript transform can't load it (unlike the tsx runner the rest of
// the test suite uses), so this narrow bridge does the Prisma work in a
// process where that loading actually works.

interface SeedInvitationInput {
  invitedEmail: string;
  workspaceName: string;
  role: InvitableWorkspaceRole;
}

interface CleanupInvitationInput {
  workspaceId: string;
  ownerId: string;
  emails: string[];
}

interface ReadMembershipInput {
  workspaceId: string;
  email: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string") {
    throw new Error(`db-fixture-runner: expected "${key}" to be a string.`);
  }

  return value;
}

function parseSeedInvitationInput(payload: unknown): SeedInvitationInput {
  if (!isRecord(payload)) throw new Error("db-fixture-runner: expected an object payload.");

  return {
    invitedEmail: requireString(payload, "invitedEmail"),
    workspaceName: requireString(payload, "workspaceName"),
    role: requireString(payload, "role") as InvitableWorkspaceRole,
  };
}

function parseReadMembershipInput(payload: unknown): ReadMembershipInput {
  if (!isRecord(payload)) throw new Error("db-fixture-runner: expected an object payload.");

  return {
    workspaceId: requireString(payload, "workspaceId"),
    email: requireString(payload, "email"),
  };
}

function parseCleanupInvitationInput(payload: unknown): CleanupInvitationInput {
  if (!isRecord(payload)) throw new Error("db-fixture-runner: expected an object payload.");
  const emails = payload.emails;
  if (!Array.isArray(emails) || !emails.every((email) => typeof email === "string")) {
    throw new Error('db-fixture-runner: expected "emails" to be a string array.');
  }

  return {
    workspaceId: requireString(payload, "workspaceId"),
    ownerId: requireString(payload, "ownerId"),
    emails,
  };
}

async function seedInvitation(prisma: PrismaClient, input: SeedInvitationInput) {
  const ownerId = randomUUID();
  const workspaceId = randomUUID();
  const token = randomUUID();

  await prisma.user.create({
    data: {
      id: ownerId,
      name: "Workspace owner",
      email: `owner-${randomUUID()}@example.test`,
    },
  });
  await prisma.workspace.create({
    data: { id: workspaceId, name: input.workspaceName },
  });
  await prisma.workspaceMember.create({
    data: { id: randomUUID(), workspaceId, userId: ownerId, role: "OWNER" },
  });
  await prisma.workspaceInvitation.create({
    data: {
      id: randomUUID(),
      workspaceId,
      email: input.invitedEmail,
      role: input.role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { workspaceId, ownerId, token };
}

async function readMembershipRole(prisma: PrismaClient, input: ReadMembershipInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return { role: null };

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: user.id } },
  });

  return { role: membership?.role ?? null };
}

async function cleanupInvitation(prisma: PrismaClient, input: CleanupInvitationInput) {
  await prisma.workspaceMember.deleteMany({ where: { workspaceId: input.workspaceId } });
  await prisma.workspaceInvitation.deleteMany({ where: { workspaceId: input.workspaceId } });
  await prisma.workspace.deleteMany({ where: { id: input.workspaceId } });
  await prisma.user.deleteMany({ where: { email: { in: input.emails } } });
  await prisma.user.deleteMany({ where: { id: input.ownerId } });
  await prisma.verificationEmailThrottle.deleteMany({
    where: { identifier: { in: input.emails } },
  });

  return { ok: true };
}

async function main() {
  const [, , action, payloadJson] = process.argv;
  const payload: unknown = JSON.parse(payloadJson ?? "{}");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const result = await (async () => {
      switch (action) {
        case "seed-invitation":
          return seedInvitation(prisma, parseSeedInvitationInput(payload));
        case "read-membership":
          return readMembershipRole(prisma, parseReadMembershipInput(payload));
        case "cleanup-invitation":
          return cleanupInvitation(prisma, parseCleanupInvitationInput(payload));
        default:
          throw new Error(`Unknown db-fixture-runner action: ${action}`);
      }
    })();

    process.stdout.write(JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
