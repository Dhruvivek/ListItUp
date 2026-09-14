/*
  Warnings:

  - You are about to drop the column `ownerId` on the `workspace` table. All the data in the column will be lost.
  - The `role` column on the `workspace_member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "WorkspaceKind" AS ENUM ('SHARED', 'PERSONAL');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- DropForeignKey
ALTER TABLE "workspace" DROP CONSTRAINT "workspace_ownerId_fkey";

-- DropIndex
DROP INDEX "workspace_ownerId_key";

-- AlterTable
ALTER TABLE "workspace" DROP COLUMN "ownerId",
ADD COLUMN     "kind" "WorkspaceKind" NOT NULL DEFAULT 'SHARED';

-- AlterTable
ALTER TABLE "workspace_invitation" ADD COLUMN     "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "workspace_member" DROP COLUMN "role",
ADD COLUMN     "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER';
