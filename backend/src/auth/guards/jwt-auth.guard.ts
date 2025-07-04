import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from 'src/user/user.entity';

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface WebSocketContext {
  req?: AuthenticatedRequest;
  extra?: {
    request?: AuthenticatedRequest;
  };
}

interface HttpContext {
  req: AuthenticatedRequest;
}

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): AuthenticatedRequest {
    const ctx = GqlExecutionContext.create(context);
    const contextType = ctx.getType<'query' | 'mutation' | 'subscription'>();

    if (contextType === 'subscription') {
      // Para subscriptions/WebSocket
      const wsContext = ctx.getContext<WebSocketContext>();
      const request = wsContext.req || wsContext.extra?.request;

      if (!request) {
        throw new UnauthorizedException(
          'Request object not found in WebSocket context',
        );
      }

      return request;
    } else {
      const httpContext = ctx.getContext<HttpContext>();

      if (!httpContext.req) {
        throw new UnauthorizedException(
          'Request object not found in HTTP context',
        );
      }

      return httpContext.req;
    }
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const contextType = ctx.getType<'query' | 'mutation' | 'subscription'>();

    // Para subscriptions WebSocket, verificar se o usuário já foi autenticado
    if (contextType === 'subscription') {
      try {
        const request = this.getRequest(context);

        if (request && request.user) {
          return true;
        }

        return super.canActivate(context);
      } catch {
        throw new UnauthorizedException(
          'User not authenticated for subscription',
        );
      }
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = User>(
    err: any,
    user: TUser | false,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }

    try {
      const request = this.getRequest(context);
      request.user = user as unknown as User;
    } catch (error) {
      console.warn(
        'Could not add user to request context:',
        (error as Error).message,
      );
    }

    return user;
  }
}
