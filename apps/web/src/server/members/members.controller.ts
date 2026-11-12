import { NextResponse } from 'next/server';
import { toErrorResponse, toSuccessResponse } from '@/server/common/http';
import { MemberService, memberService } from './member.service';

export class MembersController {
  constructor(private readonly members: MemberService) {}

  async find(_request: Request): Promise<NextResponse> {
    try {
      const data = await this.members.findMany();
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForMembersController = globalThis as unknown as {
  membersController?: MembersController;
};

export const membersController =
  globalForMembersController.membersController ??
  new MembersController(memberService);

if (process.env.NODE_ENV !== 'production') {
  globalForMembersController.membersController = membersController;
}
