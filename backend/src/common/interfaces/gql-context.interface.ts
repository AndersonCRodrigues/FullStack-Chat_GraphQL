import { Request, Response } from 'express';
import { User } from '../../user/user.entity';
import { WsRequest } from './ws-gql.interface';

export interface GqlContext {
  req: Request & { user?: User };
  res: Response;
  connection?: any;
}

export interface GqlWsContext {
  req?: {
    extra?: {
      request?: WsRequest;
    };
  };
}
