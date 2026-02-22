/*
  Warnings:

  - The `stack` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProjectStack" AS ENUM ('NEXTJS', 'ANGULAR', 'STATIC');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "stack",
ADD COLUMN     "stack" "ProjectStack" NOT NULL DEFAULT 'STATIC';
