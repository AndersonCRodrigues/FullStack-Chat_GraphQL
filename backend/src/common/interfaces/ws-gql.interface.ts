import { BaseContext } from '@apollo/server';
import { Context } from 'graphql-ws';
import { IncomingMessage } from 'http';
import { User } from '../../user/user.entity';

export interface WsRequest extends IncomingMessage {
  user?: User;
}

export interface WsConnectionExtra extends BaseContext {
  request?: WsRequest;
}

export interface GqlWsConnectionContext
  extends Context<Record<string, unknown> | undefined, unknown> {
  extra: WsConnectionExtra;
}
