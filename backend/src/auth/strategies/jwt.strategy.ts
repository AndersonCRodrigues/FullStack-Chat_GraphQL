import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';

export interface TokenPayload {
  userId: string;
  email: string;
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(JwtStrategy, 'jwt') {
  private readonly logger = new Logger(JwtAuthStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
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

  async validate(payload: TokenPayload): Promise<User> {
    this.logger.debug(
      `Validando access token para payload: ${JSON.stringify(payload)}`,
    );

    const user = await this.userService.findById(payload.userId);

    if (!user) {
      this.logger.warn(
        `Usuário com ID ${payload.userId} não encontrado durante validação de JWT.`,
      );
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }
}
