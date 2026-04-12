-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('JOB_REQUEST', 'JOB_INVITE');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "type" "RequestType" NOT NULL DEFAULT 'JOB_REQUEST';
