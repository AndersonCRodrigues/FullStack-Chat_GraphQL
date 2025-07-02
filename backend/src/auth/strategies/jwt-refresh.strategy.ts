// backend/src/auth/jwt-refresh.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { User } from 'src/user/user.entity';
import { REFRESH_TOKEN_COOKIE_NAME } from '../../common/constants/app.constants';
import { UserService } from '../../user/user.service';
import { TokenPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request): string | null => {
        const refreshTokenName =
          this.configService.get<string>(REFRESH_TOKEN_COOKIE_NAME) ||
          REFRESH_TOKEN_COOKIE_NAME;
        const cookies = req.cookies as Record<string, string> | undefined;
        const token: string | undefined =
          refreshTokenName && cookies ? cookies[refreshTokenName] : undefined;
        if (token) {
          this.logger.debug(
            `Refresh token found in cookie: "${refreshTokenName}"`,
          );
          return token;
        }
        this.logger.warn(
          `Refresh token not found in cookie: "${refreshTokenName}". Authentication rejected.`,
        );
        return null;
      },
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') ||
        'default_refresh_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload): Promise<User> {
    this.logger.verbose(
      `Validando refresh token para payload: ${JSON.stringify(payload)}`,
    );
    let refreshTokenName = this.configService.get<string>(
      REFRESH_TOKEN_COOKIE_NAME,
    );
    if (!refreshTokenName) {
      refreshTokenName = REFRESH_TOKEN_COOKIE_NAME;
    }
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken =
      cookies && refreshTokenName ? cookies[refreshTokenName] : undefined;

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Refresh token is required for this operation.',
      );
    }

    const user = await this.userService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.userId,
    );

    if (!user) {
      this.logger.warn(
        `Invalid or revoked refresh token for user ID: ${payload.userId}. Attempting to remove from DB.`,
      );
      await this.userService.removeRefreshToken(payload.userId);
      throw new UnauthorizedException(
        'Invalid or revoked refresh token. Please log in again.',
      );
    }
    this.logger.debug(`Refresh token valid for user ${user.email}.`);
    return user;
  }
}
