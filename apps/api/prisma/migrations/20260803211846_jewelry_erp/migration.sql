-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ISSUED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SchemeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "karigars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "karigars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_orders" (
    "id" TEXT NOT NULL,
    "jobNo" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purity" TEXT NOT NULL,
    "issuedWeightGram" DECIMAL(12,3) NOT NULL,
    "expectedReturnDate" DATE,
    "status" "JobStatus" NOT NULL DEFAULT 'ISSUED',
    "receivedWeightGram" DECIMAL(12,3),
    "wastageGram" DECIMAL(12,3),
    "makingAmount" DECIMAL(14,2),
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_schemes" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyAmount" DECIMAL(14,2) NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "status" "SchemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saving_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_installments" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "monthNo" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paidOn" DATE NOT NULL,

    CONSTRAINT "scheme_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_orders_jobNo_key" ON "job_orders"("jobNo");

-- CreateIndex
CREATE INDEX "job_orders_karigarId_idx" ON "job_orders"("karigarId");

-- CreateIndex
CREATE INDEX "job_orders_status_idx" ON "job_orders"("status");

-- CreateIndex
CREATE INDEX "saving_schemes_customerId_idx" ON "saving_schemes"("customerId");

-- CreateIndex
CREATE INDEX "scheme_installments_schemeId_idx" ON "scheme_installments"("schemeId");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "karigars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_schemes" ADD CONSTRAINT "saving_schemes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_installments" ADD CONSTRAINT "scheme_installments_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "saving_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
