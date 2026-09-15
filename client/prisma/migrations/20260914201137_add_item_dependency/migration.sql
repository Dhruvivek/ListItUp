-- CreateTable
CREATE TABLE "item_dependency" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_dependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_dependency_blockedId_idx" ON "item_dependency"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "item_dependency_blockerId_blockedId_key" ON "item_dependency"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "item_dependency" ADD CONSTRAINT "item_dependency_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_dependency" ADD CONSTRAINT "item_dependency_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
