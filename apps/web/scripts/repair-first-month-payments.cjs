#!/usr/bin/env node
/**
 * One-off repair (spec 11): creates the payments missing for the current month
 * on existing charges, using the shared `missingPayments`.
 *
 * Usage:
 *   node apps/web/scripts/repair-first-month-payments.cjs          # dry run, writes nothing
 *   node apps/web/scripts/repair-first-month-payments.cjs --apply  # backs up dev.db, then creates
 *
 * Prerequisites: `npm run build -w @mbongo/shared` (uses the built `dist`), and
 * DATABASE_URL in apps/web/.env (SQLite file prisma/dev.db).
 *
 * --apply copies dev.db to dev.db.bak-<YYYYMMDD-HHMMSS> next to it, then creates the
 * missing payments in one transaction. Existing payments are never modified or deleted.
 */

const fs = require('node:fs');
const path = require('node:path');

const DB_FILE = path.resolve(__dirname, '..', 'prisma', 'dev.db');
const APPLY = process.argv.includes('--apply');

function loadShared() {
  try {
    return require('@mbongo/shared');
  } catch (error) {
    if (error && String(error.message).includes('@mbongo/shared')) {
      console.error(
        '@mbongo/shared has no dist. Run: npm run build -w @mbongo/shared'
      );
      process.exit(1);
    }
    throw error;
  }
}

/** Maps a Prisma charge row to the shared Charge (same mapping as charge.service toCharge). */
function toCharge(row) {
  return {
    ...row,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Maps a Prisma payment row to the shared Payment (ISO dates). */
function toPayment(row) {
  return {
    ...row,
    dueDate: row.dueDate.toISOString(),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Per charge, the payments missing from `now` on. Read-only. */
async function planRepair(client, shared, now) {
  const rows = await client.charge.findMany({
    include: { payments: true },
    orderBy: { startDate: 'asc' },
  });
  return rows.map(({ payments, ...row }) => {
    const charge = toCharge(row);
    const missing = shared.missingPayments(
      charge,
      payments.map(toPayment),
      now
    );
    return { charge, missing };
  });
}

function printPlan(plan) {
  const totals = new Map();
  let count = 0;
  for (const { charge, missing } of plan) {
    if (missing.length === 0) continue;
    console.log(`${charge.label} (${charge.id})`);
    for (const payment of missing) {
      console.log(
        `  ${payment.dueDate}  ${payment.amount.toFixed(2)} ${payment.currency}`
      );
      totals.set(
        payment.currency,
        (totals.get(payment.currency) ?? 0) + payment.amount
      );
      count += 1;
    }
  }
  console.log(`Payments to create: ${count}`);
  for (const [currency, total] of totals) {
    console.log(`Total ${currency}: ${total.toFixed(2)}`);
  }
}

function backupStamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function backupDb() {
  const destination = `${DB_FILE}.bak-${backupStamp(new Date())}`;
  fs.copyFileSync(DB_FILE, destination);
  return destination;
}

/** Plans and creates in one transaction; returns the plan read inside it and the count created. */
async function applyRepair(prisma, shared) {
  return prisma.$transaction(async (tx) => {
    const plan = await planRepair(tx, shared, new Date());
    const data = plan.flatMap(({ missing }) =>
      missing.map((payment) => ({
        ...payment,
        dueDate: new Date(payment.dueDate),
      }))
    );
    if (data.length === 0) return { plan, count: 0 };
    const result = await tx.payment.createMany({ data });
    return { plan, count: result.count };
  });
}

async function main() {
  const shared = loadShared();
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Database not found: ${DB_FILE}`);
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    if (!APPLY) {
      const plan = await planRepair(prisma, shared, new Date());
      printPlan(plan);
      console.log(
        'Dry run: nothing written. Re-run with --apply to create them.'
      );
      return;
    }

    console.log(`Backup: ${backupDb()}`);
    const { plan, count } = await applyRepair(prisma, shared);
    printPlan(plan);
    console.log(`Created ${count} payment(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
