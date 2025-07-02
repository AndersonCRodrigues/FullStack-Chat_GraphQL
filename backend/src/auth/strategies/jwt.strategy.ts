// backend/src/auth/jwt.strategy.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { User } from 'src/user/user.entity';

export interface TokenPayload {
  userId: string;
  email: string;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(JwtStrategy, 'jwt') {
  private readonly logger = new Logger(JwtAuthStrategy.name);

  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: TokenPayload): User {
    this.logger.debug(
      `Validando access token para payload: ${JSON.stringify(payload)}`,
    );

    return {
      id: payload.userId,
      email: payload.email,
    } as User;
  }
}
