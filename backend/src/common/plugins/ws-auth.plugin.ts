// backend/src/common/plugins/ws-auth.plugin.ts
import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie';
import { IncomingMessage } from 'http';
import { AuthService } from '../../auth/auth.service';

import { TokenPayload } from 'src/auth/strategies/jwt.strategy';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { REFRESH_TOKEN_COOKIE_NAME } from '../constants/app.constants';

interface WsRequest extends IncomingMessage {
  user?: User;
}

interface GqlWsConnectionContext {
  connectionParams?: {
    Authorization?: string;
    authorization?: string;
    [key: string]: unknown;
  };
  extra?: {
    request?: WsRequest;
  };
}

@Injectable()
@Plugin()
export class WebSocketAuthPlugin implements ApolloServerPlugin<BaseContext> {
  private readonly logger = new Logger(WebSocketAuthPlugin.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async requestDidStart(
    requestContext: GraphQLRequestContext<BaseContext>,
  ): Promise<void> {
    await Promise.resolve();
    this.logger.debug(
      `GraphQL request started: ${requestContext.request.operationName || 'Unnamed Operation'}`,
    );
  }

  async authenticateWebSocketConnection(
    context: any, // <--- A tipagem 'any' é uma concessão necessária para a integração
  ): Promise<boolean> {
    const gqlWsContext = context as GqlWsConnectionContext;
    const { connectionParams } = gqlWsContext;
    const request = gqlWsContext.extra?.request; // Acesso seguro com optional chaining

    const refreshTokenName = this.configService.get<string>(
      REFRESH_TOKEN_COOKIE_NAME,
    );
    let token: string | undefined;

    const authorizationHeader =
      connectionParams?.Authorization || connectionParams?.authorization;
    if (typeof authorizationHeader === 'string') {
      token = authorizationHeader.split(' ')[1];
      if (token) {
        this.logger.debug(
          'Token found in connectionParams.Authorization header.',
        );
      }
    }

    if (!token && request?.headers?.cookie) {
      try {
        const cookies: Record<string, string> = cookie.parse(
          request.headers.cookie,
        );
        if (refreshTokenName) {
          const tokenFromCookie: string | undefined = cookies[refreshTokenName];
          if (typeof tokenFromCookie === 'string') {
            token = tokenFromCookie;
            this.logger.debug(
              `Refresh token found in cookie header: "${refreshTokenName}".`,
            );
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          this.logger.error(
            `Error parsing cookie header for WebSocket connection: ${e.message}`,
          );
        } else {
          this.logger.error(
            `Unknown error parsing cookie header: ${String(e)}`,
          );
        }
      }
    }

    if (token) {
      try {
        const decodedPayload: unknown =
          this.authService['jwtService'].decode(token);

        if (
          typeof decodedPayload === 'object' &&
          decodedPayload !== null &&
          'userId' in decodedPayload &&
          typeof (decodedPayload as TokenPayload).userId === 'string'
        ) {
          const payload = decodedPayload as TokenPayload;

          const user = await this.userService.findById(payload.userId);
          if (user) {
            if (request) {
              request.user = user;
            }
            this.logger.log(
              `WebSocket connection authenticated for user: ${user.email}`,
            );
            return true;
          }
        } else {
          this.logger.warn(
            'Decoded JWT payload is not a valid object with userId.',
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(`WebSocket Authentication Error: ${error.message}`);
        } else {
          this.logger.error(`Unknown authentication error: ${String(error)}`);
        }
        return false;
      }
    }
    this.logger.warn(
      'WebSocket connection attempt without valid authentication token. Connection rejected.',
    );
    return false;
  }
}
