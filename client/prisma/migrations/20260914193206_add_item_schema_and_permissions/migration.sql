-- CreateEnum
CREATE TYPE "ItemState" AS ENUM ('TO_DO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateTable
CREATE TABLE "item" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "parentId" TEXT,
    "sectionId" TEXT,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "state" "ItemState" NOT NULL DEFAULT 'TO_DO',
    "priority" "ItemPriority" NOT NULL DEFAULT 'NORMAL',
    "blockerReason" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_assignee" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_assignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_listId_idx" ON "item"("listId");

-- CreateIndex
CREATE INDEX "item_sectionId_idx" ON "item"("sectionId");

-- CreateIndex
CREATE INDEX "item_parentId_idx" ON "item"("parentId");

-- CreateIndex
CREATE INDEX "item_assignee_userId_idx" ON "item_assignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "item_assignee_itemId_userId_key" ON "item_assignee"("itemId", "userId");

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignee" ADD CONSTRAINT "item_assignee_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignee" ADD CONSTRAINT "item_assignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
