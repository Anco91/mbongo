-- CreateTable
CREATE TABLE "merchant_categories" (
    "merchant" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
