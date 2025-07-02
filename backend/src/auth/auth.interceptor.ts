import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REFRESH_TOKEN_COOKIE_NAME } from '../common/constants/app.constants';
import { GqlContext } from '../common/interfaces/gql-context.interface';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const contextObject = gqlContext.getContext<GqlContext>();
    const res: Response | undefined = contextObject?.res;

    return next.handle().pipe(
      tap((data) => {
        if (
          res &&
          typeof data === 'object' &&
          data !== null &&
          'refreshToken' in data
        ) {
          const payload = data as { refreshToken: string };

          const refreshTokenName =
            this.configService.get<string>(REFRESH_TOKEN_COOKIE_NAME) ??
            'refreshToken';

          const expiresIn = 7 * 24 * 60 * 60 * 1000;

          res.cookie(refreshTokenName, payload.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(Date.now() + expiresIn),
            path: '/',
          });

          this.logger.debug(
            `Refresh token set as HTTP-only cookie: "${refreshTokenName}"`,
          );

          delete (data as { refreshToken?: string }).refreshToken;
        }
      }),
    );
  }
}
