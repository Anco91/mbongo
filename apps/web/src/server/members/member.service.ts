import 'server-only';
import { prisma } from '@/server/db';
import { createWhereTranslator } from '@/server/common/where-translator';
import { NotFoundError } from '@/server/common/http';
import {
  Member,
  CreateMemberInput,
  UpdateMemberInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';

const memberWhereTranslator = createWhereTranslator<Prisma.MemberWhereInput>({
  firstName: { ops: ['eq', 'contains', 'startsWith'] },
  role: { ops: ['eq', 'in'] },
});

export class MemberService {
  async findMany(query?: Record<string, unknown>): Promise<Member[]> {
    const rows = await prisma.member.findMany({
      where: query ? memberWhereTranslator(query) : undefined,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toMember(row));
  }

  async create(input: CreateMemberInput): Promise<Member> {
    const row = await prisma.member.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        role: input.role,
      },
    });
    return this.toMember(row);
  }

  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Member', id);
    const row = await prisma.member.update({
      where: { id },
      data: {
        firstName: input.firstName ?? undefined,
        lastName:
          input.lastName === undefined ? undefined : (input.lastName ?? null),
        role: input.role ?? undefined,
      },
    });
    return this.toMember(row);
  }

  /**
   * Suppression transactionnelle (M4, design D1) : les comptes du membre
   * sont d'abord dé-liés (memberId = null), puis le membre est supprimé.
   * Un échec ne laisse ni compte dé-lié ni membre fantôme.
   */
  async remove(id: string): Promise<void> {
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Member', id);
    await prisma.$transaction(async (tx) => {
      await tx.account.updateMany({
        where: { memberId: id },
        data: { memberId: null },
      });
      await tx.member.delete({ where: { id } });
    });
  }

  private toMember(row: Prisma.MemberGetPayload<object>): Member {
    return {
      ...row,
      role: row.role as Member['role'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForMemberService = globalThis as { memberService?: MemberService };
export const memberService =
  globalForMemberService.memberService ?? new MemberService();

if (process.env.NODE_ENV !== 'production') {
  globalForMemberService.memberService = memberService;
}
