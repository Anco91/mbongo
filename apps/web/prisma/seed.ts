/**
 * Prisma Seed — Données de la maquette M1
 *
 * Données représentatives du flux : salaire CHF → UBS → Telexoo → BoursoBank → joint
 *
 * Usage: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

/* eslint-disable no-console -- a seed script logs its progress */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ─── Members ──────────────────────────────────────────────────────────────
  const anco = await prisma.member.upsert({
    where: { id: 'member-anco-0001' },
    update: {},
    create: {
      id: 'member-anco-0001',
      firstName: 'Anco',
    },
  });

  const epouse = await prisma.member.upsert({
    where: { id: 'member-epouse-001' },
    update: {},
    create: {
      id: 'member-epouse-001',
      firstName: 'Épouse',
    },
  });

  console.log(`  ✓ Members: ${anco.firstName}, ${epouse.firstName}`);

  // ─── Accounts ─────────────────────────────────────────────────────────────
  const ubsCourant = await prisma.account.upsert({
    where: { id: 'account-ubs-courant' },
    update: {},
    create: {
      id: 'account-ubs-courant',
      name: 'UBS Courant',
      bank: 'UBS',
      currency: 'CHF',
      accountType: 'CURRENT',
      memberId: anco.id,
      overdraftLimit: 1000,
      openingBalance: 0,
      status: 'ACTIVE',
    },
  });

  const bnpPerso = await prisma.account.upsert({
    where: { id: 'account-bnp-perso' },
    update: {},
    create: {
      id: 'account-bnp-perso',
      name: 'BNP Perso',
      bank: 'BNP Paribas',
      currency: 'EUR',
      accountType: 'CURRENT',
      memberId: anco.id,
      openingBalance: 0,
      status: 'ACTIVE',
    },
  });

  const bnpJoint = await prisma.account.upsert({
    where: { id: 'account-bnp-joint' },
    update: {},
    create: {
      id: 'account-bnp-joint',
      name: 'BNP Joint',
      bank: 'BNP Paribas',
      currency: 'EUR',
      accountType: 'JOINT',
      memberId: null,
      openingBalance: 0,
      status: 'ACTIVE',
    },
  });

  console.log(
    `  ✓ Accounts: ${ubsCourant.name}, ${bnpPerso.name}, ${bnpJoint.name}`
  );

  // ─── Source de revenu récurrente + état mensuel ───────────────────────────
  const salaireSource = await prisma.income.upsert({
    where: { id: 'income-salaire' },
    update: {},
    create: {
      id: 'income-salaire',
      label: 'Salaire',
      amount: 4400,
      currency: 'CHF',
      accountId: ubsCourant.id,
      memberId: anco.id,
      frequency: 'monthly',
      startDate: new Date('2026-01-01T12:00:00.000Z'),
      active: true,
    },
  });

  // Le mois précédent est préparé : le mois courant reste « à préparer »
  // pour que l'invitation du dashboard soit visible en développement.
  const previousMonth = (() => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  })();
  await prisma.monthlyBudget.upsert({
    where: { month: previousMonth },
    update: { preparedAt: new Date() },
    create: { month: previousMonth, preparedAt: new Date() },
  });

  console.log(`  ✓ Income: ${salaireSource.label} + budget ${previousMonth}`);

  // ─── Transactions représentatives (UBS Courant) ───────────────────────────
  const salaire = await prisma.transaction.upsert({
    where: { id: 'tx-salaire-nov-2026' },
    update: { incomeId: salaireSource.id, budgetMonth: '2026-11' },
    create: {
      id: 'tx-salaire-nov-2026',
      accountId: ubsCourant.id,
      date: new Date('2026-11-01T00:00:00.000Z'),
      amount: 4400,
      category: 'SALAIRE',
      note: 'Salaire novembre 2026',
      incomeId: salaireSource.id,
      budgetMonth: '2026-11',
    },
  });

  const loyer = await prisma.transaction.upsert({
    where: { id: 'tx-loyer-nov-2026' },
    update: {},
    create: {
      id: 'tx-loyer-nov-2026',
      accountId: ubsCourant.id,
      date: new Date('2026-11-03T00:00:00.000Z'),
      amount: -1800,
      category: 'LOYER',
      note: 'Loyer novembre 2026',
    },
  });

  const courses = await prisma.transaction.upsert({
    where: { id: 'tx-courses-nov-2026' },
    update: {},
    create: {
      id: 'tx-courses-nov-2026',
      accountId: ubsCourant.id,
      date: new Date('2026-11-05T00:00:00.000Z'),
      amount: -320.5,
      category: 'ALIMENTATION',
      note: 'Courses semaine 1',
    },
  });

  console.log(
    `  ✓ Transactions: ${salaire.category}, ${loyer.category}, ${courses.category}`
  );

  // ─── Transfer ESTIMATED (Telexoo : 1500 CHF → EUR) ───────────────────────
  const transfer = await prisma.transfer.upsert({
    where: { id: 'transfer-telexoo-nov-2026' },
    update: {},
    create: {
      id: 'transfer-telexoo-nov-2026',
      sourceAccountId: ubsCourant.id,
      targetAccountId: bnpPerso.id,
      amountSent: 1500,
      rateEstimated: 0.9231,
      rateDate: new Date('2026-11-06T00:00:00.000Z'),
      status: 'ESTIMATED',
      sentAt: new Date('2026-11-06T10:00:00.000Z'),
      memo: 'Virement Telexoo novembre 2026',
    },
  });

  // Transaction de débit source liée au transfert
  await prisma.transaction.upsert({
    where: { id: 'tx-telexoo-debit' },
    update: {},
    create: {
      id: 'tx-telexoo-debit',
      accountId: ubsCourant.id,
      date: new Date('2026-11-06T10:00:00.000Z'),
      amount: -1500,
      category: 'VIREMENT',
      note: 'Virement Telexoo — débit CHF',
      transferId: transfer.id,
      transferRole: 'SOURCE',
    },
  });

  console.log(
    `  ✓ Transfer ESTIMATED: ${transfer.memo} (${transfer.amountSent} CHF)`
  );

  // ─── BalanceSnapshot sur UBS Courant ──────────────────────────────────────
  await prisma.balanceSnapshot.upsert({
    where: { id: 'snapshot-ubs-nov-2026' },
    update: {},
    create: {
      id: 'snapshot-ubs-nov-2026',
      accountId: ubsCourant.id,
      date: new Date('2026-11-06T00:00:00.000Z'),
      balance: 779.5, // 0 + 4400 - 1800 - 320.5 - 1500
      note: 'Snapshot après virements novembre',
    },
  });

  console.log('  ✓ BalanceSnapshot: UBS Courant après virements');

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
