import { NextResponse } from 'next/server';
import { snapshotQuerySchema, createSnapshotSchema } from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
} from '@/server/common/http';
import { SnapshotService, snapshotService } from './snapshot.service';

export class SnapshotsController {
  constructor(private readonly snapshots: SnapshotService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, snapshotQuerySchema);
      const data = await this.snapshots.findMany(query);
      return toSuccessResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createSnapshotSchema);
      const data = await this.snapshots.create({
        ...input,
        note: input.note ?? null,
      });
      return toCreatedResponse(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForSnapshotsController = globalThis as unknown as {
  snapshotsController?: SnapshotsController;
};

export const snapshotsController =
  globalForSnapshotsController.snapshotsController ??
  new SnapshotsController(snapshotService);

if (process.env.NODE_ENV !== 'production') {
  globalForSnapshotsController.snapshotsController = snapshotsController;
}
