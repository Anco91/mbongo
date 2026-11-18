/**
 * M4 tests for Member CRUD (vue foyer):
 * - schema: lastName optional on member / create / update
 * - service: create, update (partial), transactional delete (accounts unlinked)
 * - routes: POST /api/members → 201, PATCH /api/members/:id → 200,
 *   DELETE /api/members/:id → 204, unknown member → 404
 *
 * @module Tests/Members/M4HouseholdMembers
 * @jest-environment node
 */
jest.mock('@/server/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    member: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: { updateMany: jest.fn() },
  },
}));

import { prisma } from '@/server/db';
import { MemberService } from '@/server/members/member.service';
import { membersController } from '@/server/members/members.controller';
import { POST as postMembers } from '@/app/api/members/route';
import {
  PATCH as patchMember,
  DELETE as deleteMember,
} from '@/app/api/members/[id]/route';
import {
  memberSchema,
  createMemberSchema,
  updateMemberSchema,
} from '@mbongo/shared';

const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedMemberCreate = prisma.member.create as jest.Mock;
const mockedMemberUpdate = prisma.member.update as jest.Mock;
const mockedMemberDelete = prisma.member.delete as jest.Mock;
const mockedMemberFindUnique = prisma.member.findUnique as jest.Mock;
const mockedAccountUpdateMany = prisma.account.updateMany as jest.Mock;

const memberRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'member-1',
  firstName: 'Anco',
  lastName: null,
  role: 'PRIMARY',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const jsonRequest = (body: unknown): Request =>
  new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

describe('member schemas (lastName optionnel)', () => {
  it('memberSchema accepte un membre sans lastName (seed inchangé)', () => {
    const member = {
      id: 'member-1',
      firstName: 'Anco',
      role: 'PRIMARY' as const,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(memberSchema.parse(member).lastName).toBeUndefined();
  });

  it('memberSchema normalise lastName vide en null', () => {
    const parsed = memberSchema.parse({
      id: 'member-1',
      firstName: 'Anco',
      lastName: '',
      role: 'PRIMARY',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(parsed.lastName).toBeNull();
  });

  it('memberSchema accepte un lastName', () => {
    const parsed = memberSchema.parse({
      id: 'member-1',
      firstName: 'Anco',
      lastName: 'Dupont',
      role: 'PRIMARY',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(parsed.lastName).toBe('Dupont');
  });

  it('createMemberSchema exige firstName, lastName optionnel', () => {
    expect(
      createMemberSchema.safeParse({ firstName: 'Anco', role: 'PRIMARY' })
        .success
    ).toBe(true);
    expect(createMemberSchema.safeParse({ role: 'PRIMARY' }).success).toBe(
      false
    );
  });

  it('updateMemberSchema : tous les champs optionnels', () => {
    expect(updateMemberSchema.safeParse({}).success).toBe(true);
    expect(updateMemberSchema.safeParse({ firstName: 'Nouveau' }).success).toBe(
      true
    );
  });
});

describe('MemberService CRUD', () => {
  it('create persiste firstName, lastName nullable et role', async () => {
    mockedMemberCreate.mockResolvedValue(memberRow({ lastName: 'Dupont' }));
    const service = new MemberService();
    const member = await service.create({
      firstName: 'Anco',
      lastName: 'Dupont',
      role: 'PRIMARY',
    });
    expect(mockedMemberCreate).toHaveBeenCalledWith({
      data: { firstName: 'Anco', lastName: 'Dupont', role: 'PRIMARY' },
    });
    expect(member.lastName).toBe('Dupont');
  });

  it('create sans lastName persiste null', async () => {
    mockedMemberCreate.mockResolvedValue(memberRow());
    const service = new MemberService();
    await service.create({ firstName: 'Épouse', role: 'PARTNER' });
    expect(mockedMemberCreate).toHaveBeenCalledWith({
      data: { firstName: 'Épouse', lastName: null, role: 'PARTNER' },
    });
  });

  it('update partiel ne touche que les champs fournis', async () => {
    mockedMemberFindUnique.mockResolvedValue(memberRow());
    mockedMemberUpdate.mockResolvedValue(memberRow({ firstName: 'Renommé' }));
    const service = new MemberService();
    const member = await service.update('member-1', { firstName: 'Renommé' });
    expect(mockedMemberUpdate).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: {
        firstName: 'Renommé',
        lastName: undefined,
        role: undefined,
      },
    });
    expect(member.firstName).toBe('Renommé');
  });

  it('update nullifie lastName explicitement', async () => {
    mockedMemberFindUnique.mockResolvedValue(memberRow({ lastName: 'Dupont' }));
    mockedMemberUpdate.mockResolvedValue(memberRow());
    const service = new MemberService();
    await service.update('member-1', { lastName: null });
    expect(mockedMemberUpdate).toHaveBeenCalledWith({
      where: { id: 'member-1' },
      data: { firstName: undefined, lastName: null, role: undefined },
    });
  });

  it('remove dé-lie les comptes puis supprime, transactionnellement', async () => {
    mockedMemberFindUnique.mockResolvedValue(memberRow());
    mockedMemberDelete.mockResolvedValue(memberRow());
    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        account: { updateMany: mockedAccountUpdateMany },
        member: { delete: mockedMemberDelete },
      })
    );
    const service = new MemberService();
    await service.remove('member-1');
    expect(mockedAccountUpdateMany).toHaveBeenCalledWith({
      where: { memberId: 'member-1' },
      data: { memberId: null },
    });
    expect(mockedMemberDelete).toHaveBeenCalledWith({
      where: { id: 'member-1' },
    });
  });

  it('remove d’un membre inconnu → NotFoundError', async () => {
    mockedMemberFindUnique.mockResolvedValue(null);
    const service = new MemberService();
    await expect(service.remove('ghost')).rejects.toThrow('404');
    expect(mockedTransaction).not.toHaveBeenCalled();
  });
});

describe('Members API routes', () => {
  it('POST /api/members → 201', async () => {
    mockedMemberCreate.mockResolvedValue(memberRow());
    const response = await postMembers(
      jsonRequest({ firstName: 'Anco', role: 'PRIMARY' })
    );
    expect(response.status).toBe(201);
  });

  it('POST /api/members avec body invalide → 400', async () => {
    const response = await postMembers(jsonRequest({ role: 'PRIMARY' }));
    expect(response.status).toBe(400);
  });

  it('PATCH /api/members/:id → 200', async () => {
    mockedMemberFindUnique.mockResolvedValue(memberRow());
    mockedMemberUpdate.mockResolvedValue(
      memberRow({ firstName: 'Nouveau prénom' })
    );
    const response = await patchMember(
      jsonRequest({ firstName: 'Nouveau prénom' }),
      { params: Promise.resolve({ id: 'member-1' }) }
    );
    expect(response.status).toBe(200);
  });

  it('PATCH /api/members/:id inconnu → 404', async () => {
    mockedMemberFindUnique.mockResolvedValue(null);
    const response = await patchMember(jsonRequest({ firstName: 'X' }), {
      params: Promise.resolve({ id: 'ghost' }),
    });
    expect(response.status).toBe(404);
  });

  it('DELETE /api/members/:id → 204', async () => {
    mockedMemberFindUnique.mockResolvedValue(memberRow());
    mockedMemberDelete.mockResolvedValue(memberRow());
    mockedTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        account: { updateMany: mockedAccountUpdateMany },
        member: { delete: mockedMemberDelete },
      })
    );
    const response = await deleteMember(new Request('http://localhost/api'), {
      params: Promise.resolve({ id: 'member-1' }),
    });
    expect(response.status).toBe(204);
  });
});
