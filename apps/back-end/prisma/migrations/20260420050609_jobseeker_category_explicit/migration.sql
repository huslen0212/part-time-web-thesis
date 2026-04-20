-- CreateTable
CREATE TABLE "JobSeekerCategory" (
    "jobseekerId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "JobSeekerCategory_pkey" PRIMARY KEY ("jobseekerId","categoryId")
);

-- AddForeignKey
ALTER TABLE "JobSeekerCategory" ADD CONSTRAINT "JobSeekerCategory_jobseekerId_fkey" FOREIGN KEY ("jobseekerId") REFERENCES "JobSeeker"("jobseekerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSeekerCategory" ADD CONSTRAINT "JobSeekerCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
