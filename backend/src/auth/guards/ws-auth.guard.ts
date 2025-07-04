import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlWsContext } from 'src/common/interfaces/gql-context.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const wsContext = ctx.getContext<GqlWsContext>();
    const user = wsContext.req?.extra?.request?.user;

    if (!user) {
      throw new UnauthorizedException(
        'User not authenticated for subscription',
      );
    }

    return true;
  }
}
