import { memberSchema, type Member, type MemberHttp } from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const membersRepository: MemberHttp = {
  async findMany(): Promise<Member[]> {
    const members = await request<Member[]>('GET', '/members');
    return z.array(memberSchema).parse(members);
  },
};
