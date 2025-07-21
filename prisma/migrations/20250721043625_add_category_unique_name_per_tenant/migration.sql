/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "categories_name_tenantId_key" ON "categories"("name", "tenantId");
