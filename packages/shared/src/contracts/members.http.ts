import type { Member } from '../schemas/member';

export interface MemberHttp {
  findMany(): Promise<Member[]>;
}
