import { NextResponse } from 'next/server';
import {
  createMemberSchema,
  updateMemberSchema,
} from '@mbongo/shared';
import { parseBody, toErrorResponse, toSuccessResponse, toCreatedResponse, toNoContentResponse } from '@/server/common/http';
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

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createMemberSchema);
      const data = await this.members.create(input);
      return toCreatedResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updateMemberSchema);
      const data = await this.members.update(id, input);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async remove(id: string): Promise<NextResponse> {
    try {
      await this.members.remove(id);
      return toNoContentResponse();
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
