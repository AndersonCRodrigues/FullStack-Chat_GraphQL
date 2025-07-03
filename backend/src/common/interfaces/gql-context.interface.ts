// backend/src/common/interfaces/gql-context.interface.ts
import { Request, Response } from 'express';
import { User } from '../../user/user.entity';

export interface GqlContext {
  req: Request & { user?: User };
  res: Response;
  connection?: any;
}
