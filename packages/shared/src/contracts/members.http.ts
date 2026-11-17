import type {
  Member,
  CreateMemberInput,
  UpdateMemberInput,
} from '../schemas/member';

export interface MemberHttp {
  findMany(): Promise<Member[]>;
  create(input: CreateMemberInput): Promise<Member>;
  update(id: string, input: UpdateMemberInput): Promise<Member>;
  remove(id: string): Promise<void>;
}
