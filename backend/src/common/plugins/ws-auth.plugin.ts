import {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContext,
} from '@apollo/server';
import { Plugin } from '@nestjs/apollo';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookie from 'cookie';

import { TokenPayload } from 'src/auth/strategies/jwt.strategy';
import { AuthService } from '../../auth/auth.service';

import { UserService } from '../../user/user.service';
import { REFRESH_TOKEN_COOKIE_NAME } from '../constants/app.constants';
import { GqlWsConnectionContext } from '../interfaces/ws-gql.interface';

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

  public authenticateWebSocketConnection = async (
    context: GqlWsConnectionContext,
  ): Promise<boolean> => {
    const connectionParams = context?.connectionParams;
    const request = context?.extra?.request;

    if (!request) {
      this.logger.warn(
        'Request object is missing from WebSocket context. Cannot authenticate.',
      );
      return false;
    }

    const headers = request.headers || {};
    const refreshTokenName = this.configService.get<string>(
      REFRESH_TOKEN_COOKIE_NAME,
    );
    let token: string | undefined;

    const authorizationHeader =
      connectionParams?.Authorization ||
      connectionParams?.authorization ||
      headers['authorization'] ||
      headers['Authorization'];

    if (typeof authorizationHeader === 'string') {
      token = authorizationHeader.split(' ')[1];
      if (token) {
        this.logger.debug('Token found in header.');
      }
    }

    if (!token && headers.cookie) {
      try {
        const cookies: Record<string, string> = cookie.parse(headers.cookie);
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
            request.user = user;
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
  };
}
