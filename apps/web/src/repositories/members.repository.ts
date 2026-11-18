import {
  memberSchema,
  type MemberHttp,
  type Member,
  type CreateMemberInput,
  type UpdateMemberInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const membersRepository: MemberHttp = {
  async findMany(): Promise<Member[]> {
    const members = await request<Member[]>('GET', '/members');
    return z.array(memberSchema).parse(members);
  },

  async create(input: CreateMemberInput): Promise<Member> {
    const member = await request<Member>('POST', '/members', { body: input });
    return memberSchema.parse(member);
  },

  async update(id: string, input: UpdateMemberInput): Promise<Member> {
    const member = await request<Member>('PATCH', `/members/${id}`, {
      body: input,
    });
    return memberSchema.parse(member);
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/members/${id}`);
  },
};
