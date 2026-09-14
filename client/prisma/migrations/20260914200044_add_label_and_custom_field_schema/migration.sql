-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DROPDOWN', 'DATE');

-- CreateTable
CREATE TABLE "label" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_label" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definition" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_value" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "label_workspaceId_idx" ON "label"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "label_workspaceId_name_key" ON "label"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "item_label_labelId_idx" ON "item_label"("labelId");

-- CreateIndex
CREATE UNIQUE INDEX "item_label_itemId_labelId_key" ON "item_label"("itemId", "labelId");

-- CreateIndex
CREATE INDEX "custom_field_definition_listId_idx" ON "custom_field_definition"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definition_listId_name_key" ON "custom_field_definition"("listId", "name");

-- CreateIndex
CREATE INDEX "custom_field_value_definitionId_idx" ON "custom_field_value"("definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_value_itemId_definitionId_key" ON "custom_field_value"("itemId", "definitionId");

-- AddForeignKey
ALTER TABLE "label" ADD CONSTRAINT "label_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_label" ADD CONSTRAINT "item_label_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_label" ADD CONSTRAINT "item_label_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definition" ADD CONSTRAINT "custom_field_definition_listId_fkey" FOREIGN KEY ("listId") REFERENCES "list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_value" ADD CONSTRAINT "custom_field_value_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "custom_field_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
