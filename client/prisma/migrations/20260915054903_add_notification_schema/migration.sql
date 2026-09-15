-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ASSIGNEE_ADDED', 'ASSIGNEE_REMOVED', 'NOTE_ADDED', 'MENTIONED', 'STATE_CHANGED', 'DUE_DATE_REMINDER');

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorId" TEXT,
    "noteId" TEXT,
    "dueDateAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "bookmarkedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_recipientId_createdAt_idx" ON "notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_recipientId_type_idx" ON "notification"("recipientId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipientId_itemId_type_dueDateAt_key" ON "notification"("recipientId", "itemId", "type", "dueDateAt");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
