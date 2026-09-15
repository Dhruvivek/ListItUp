-- CreateTable
CREATE TABLE "muted_notification_type" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "muted_notification_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "muted_notification_type_userId_type_key" ON "muted_notification_type"("userId", "type");

-- AddForeignKey
ALTER TABLE "muted_notification_type" ADD CONSTRAINT "muted_notification_type_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
