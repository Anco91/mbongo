-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bank" TEXT,
    "currency" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "memberId" TEXT,
    "overdraftLimit" REAL NOT NULL DEFAULT 0,
    "deferredCard" BOOLEAN NOT NULL DEFAULT false,
    "billingDay" INTEGER,
    "linkedAccountId" TEXT,
    "openingBalance" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "accounts_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT,
    "note" TEXT,
    "transferId" TEXT,
    "transferRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "transfers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
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
    CONSTRAINT "transfers_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "balance_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "balance" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "balance_snapshots_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "frequency" TEXT,
    "installments" INTEGER,
    "provisioned" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "charges_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scheduled_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "chargeId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scheduled_payments_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "charges" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scheduled_payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "accounts_name_idx" ON "accounts"("name");

-- CreateIndex
CREATE INDEX "accounts_memberId_idx" ON "accounts"("memberId");

-- CreateIndex
CREATE INDEX "accounts_status_idx" ON "accounts"("status");

-- CreateIndex
CREATE INDEX "accounts_linkedAccountId_idx" ON "accounts"("linkedAccountId");

-- CreateIndex
CREATE INDEX "transactions_accountId_date_idx" ON "transactions"("accountId", "date");

-- CreateIndex
CREATE INDEX "transactions_transferId_idx" ON "transactions"("transferId");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "transfers_sourceAccountId_idx" ON "transfers"("sourceAccountId");

-- CreateIndex
CREATE INDEX "transfers_targetAccountId_idx" ON "transfers"("targetAccountId");

-- CreateIndex
CREATE INDEX "balance_snapshots_accountId_date_idx" ON "balance_snapshots"("accountId", "date");

-- CreateIndex
CREATE INDEX "charges_accountId_idx" ON "charges"("accountId");

-- CreateIndex
CREATE INDEX "charges_type_idx" ON "charges"("type");

-- CreateIndex
CREATE INDEX "charges_category_idx" ON "charges"("category");

-- CreateIndex
CREATE INDEX "charges_startDate_idx" ON "charges"("startDate");

-- CreateIndex
CREATE INDEX "charges_endDate_idx" ON "charges"("endDate");

-- CreateIndex
CREATE INDEX "charges_provisioned_idx" ON "charges"("provisioned");

-- CreateIndex
CREATE INDEX "scheduled_payments_chargeId_idx" ON "scheduled_payments"("chargeId");

-- CreateIndex
CREATE INDEX "scheduled_payments_dueDate_idx" ON "scheduled_payments"("dueDate");

-- CreateIndex
CREATE INDEX "scheduled_payments_status_idx" ON "scheduled_payments"("status");

-- CreateIndex
CREATE INDEX "scheduled_payments_paidAt_idx" ON "scheduled_payments"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_payments_transactionId_key" ON "scheduled_payments"("transactionId");
