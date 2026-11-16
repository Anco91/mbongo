import 'server-only';
import { prisma } from '@/server/db';
import { createWhereTranslator } from '@/server/common/where-translator';
import { Member } from '@mbongo/shared';
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
