-- CreateEnum
CREATE TYPE "MakingChargeType" AS ENUM ('PER_GRAM', 'FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'SOLD');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hsnCode" TEXT,
    "defaultMakingType" "MakingChargeType" NOT NULL DEFAULT 'PER_GRAM',
    "defaultMakingRate" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "defaultWastagePercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "metal" "MetalType" NOT NULL,
    "purity" TEXT NOT NULL,
    "grossWeightGram" DECIMAL(12,3) NOT NULL,
    "stoneWeightGram" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "netWeightGram" DECIMAL(12,3) NOT NULL,
    "makingType" "MakingChargeType" NOT NULL,
    "makingRate" DECIMAL(12,3) NOT NULL,
    "wastagePercent" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "huid" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ItemStatus" NOT NULL DEFAULT 'IN_STOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_code_key" ON "product_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "items_sku_key" ON "items"("sku");

-- CreateIndex
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_metal_purity_idx" ON "items"("metal", "purity");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
