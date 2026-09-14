-- CreateEnum
CREATE TYPE "ListMemberRole" AS ENUM ('LEAD', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ListStatus" AS ENUM ('ON_TRACK', 'ON_HOLD', 'COMPLETED', 'DROPPED');

-- AlterTable
ALTER TABLE "list" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "ListStatus" NOT NULL DEFAULT 'ON_TRACK';

-- CreateTable
CREATE TABLE "list_member" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ListMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "list_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "starred" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "starred_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "list_member_userId_idx" ON "list_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "list_member_listId_userId_key" ON "list_member"("listId", "userId");

-- CreateIndex
CREATE INDEX "guest_userId_idx" ON "guest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_listId_userId_key" ON "guest"("listId", "userId");

-- CreateIndex
CREATE INDEX "starred_listId_idx" ON "starred"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "starred_userId_listId_key" ON "starred"("userId", "listId");

-- CreateIndex
CREATE INDEX "section_listId_idx" ON "section"("listId");

-- AddForeignKey
ALTER TABLE "list_member" ADD CONSTRAINT "list_member_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "list_member" ADD CONSTRAINT "list_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starred" ADD CONSTRAINT "starred_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starred" ADD CONSTRAINT "starred_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;
