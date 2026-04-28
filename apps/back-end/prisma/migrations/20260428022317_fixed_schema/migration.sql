/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `Employer` table. All the data in the column will be lost.
  - You are about to drop the column `employerId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `interestedCategoryId` on the `JobSeeker` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `JobSeeker` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `JobSeeker` table. All the data in the column will be lost.
  - The primary key for the `JobSeekerCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `jobseekerId` on the `JobSeekerCategory` table. All the data in the column will be lost.
  - You are about to drop the column `jobSeekerId` on the `Request` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jobSeekerUserId,jobId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employerUserId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerUserId` to the `JobSeekerCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobSeekerUserId` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_employerId_fkey";

-- DropForeignKey
ALTER TABLE "JobSeeker" DROP CONSTRAINT "JobSeeker_interestedCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "JobSeekerCategory" DROP CONSTRAINT "JobSeekerCategory_jobseekerId_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_jobSeekerId_fkey";

-- DropIndex
DROP INDEX "Request_jobSeekerId_jobId_key";

-- AlterTable
ALTER TABLE "Employer" DROP COLUMN "phoneNumber";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "employerId",
ADD COLUMN     "employerUserId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "JobSeeker" DROP COLUMN "interestedCategoryId",
DROP COLUMN "phoneNumber",
DROP COLUMN "skills",
ADD COLUMN     "skill" VARCHAR(250);

-- AlterTable
ALTER TABLE "JobSeekerCategory" DROP CONSTRAINT "JobSeekerCategory_pkey",
DROP COLUMN "jobseekerId",
ADD COLUMN     "jobSeekerUserId" INTEGER NOT NULL,
ADD CONSTRAINT "JobSeekerCategory_pkey" PRIMARY KEY ("jobSeekerUserId", "categoryId");

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "jobSeekerId",
ADD COLUMN     "jobSeekerUserId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Request_jobSeekerUserId_jobId_key" ON "Request"("jobSeekerUserId", "jobId");

-- AddForeignKey
ALTER TABLE "JobSeekerCategory" ADD CONSTRAINT "JobSeekerCategory_jobSeekerUserId_fkey" FOREIGN KEY ("jobSeekerUserId") REFERENCES "JobSeeker"("jobseekerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerUserId_fkey" FOREIGN KEY ("employerUserId") REFERENCES "Employer"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_jobSeekerUserId_fkey" FOREIGN KEY ("jobSeekerUserId") REFERENCES "JobSeeker"("jobseekerId") ON DELETE RESTRICT ON UPDATE CASCADE;
