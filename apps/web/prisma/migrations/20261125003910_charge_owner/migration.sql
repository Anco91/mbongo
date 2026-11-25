-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_charges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "frequency" TEXT,
    "installments" INTEGER,
    "dueDay" INTEGER,
    "provisioned" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    "memberId" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "charges_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "charges_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_charges" ("accountId", "amount", "category", "createdAt", "currency", "dueDay", "endDate", "frequency", "id", "installments", "label", "provisioned", "startDate", "subcategory", "type", "updatedAt") SELECT "accountId", "amount", "category", "createdAt", "currency", "dueDay", "endDate", "frequency", "id", "installments", "label", "provisioned", "startDate", "subcategory", "type", "updatedAt" FROM "charges";
DROP TABLE "charges";
ALTER TABLE "new_charges" RENAME TO "charges";
CREATE INDEX "charges_accountId_idx" ON "charges"("accountId");
CREATE INDEX "charges_memberId_idx" ON "charges"("memberId");
CREATE INDEX "charges_type_idx" ON "charges"("type");
CREATE INDEX "charges_category_idx" ON "charges"("category");
CREATE INDEX "charges_startDate_idx" ON "charges"("startDate");
CREATE INDEX "charges_endDate_idx" ON "charges"("endDate");
CREATE INDEX "charges_provisioned_idx" ON "charges"("provisioned");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
