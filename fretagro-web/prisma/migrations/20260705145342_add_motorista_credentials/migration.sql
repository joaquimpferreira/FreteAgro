/*
  Warnings:

  - A unique constraint covering the columns `[supabaseUserId]` on the table `motoristas` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN     "email" TEXT,
ADD COLUMN     "supabaseUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_supabaseUserId_key" ON "motoristas"("supabaseUserId");
