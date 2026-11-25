-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT,
    "externalLabel" TEXT,
    "amountSent" REAL NOT NULL,
    "rateEstimated" REAL NOT NULL,
    "rateDate" DATETIME NOT NULL,
    "amountReceived" REAL,
    "rateEffective" REAL,
    "fees" REAL,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ESTIMATED',
    "sentAt" DATETIME NOT NULL,
    "receivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transfers_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfers_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transfers" ("amountReceived", "amountSent", "createdAt", "fees", "id", "memo", "rateDate", "rateEffective", "rateEstimated", "receivedAt", "sentAt", "sourceAccountId", "status", "targetAccountId", "updatedAt") SELECT "amountReceived", "amountSent", "createdAt", "fees", "id", "memo", "rateDate", "rateEffective", "rateEstimated", "receivedAt", "sentAt", "sourceAccountId", "status", "targetAccountId", "updatedAt" FROM "transfers";
DROP TABLE "transfers";
ALTER TABLE "new_transfers" RENAME TO "transfers";
CREATE INDEX "transfers_status_idx" ON "transfers"("status");
CREATE INDEX "transfers_sourceAccountId_idx" ON "transfers"("sourceAccountId");
CREATE INDEX "transfers_targetAccountId_idx" ON "transfers"("targetAccountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
