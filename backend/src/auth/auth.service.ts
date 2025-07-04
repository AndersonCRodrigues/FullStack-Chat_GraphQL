import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
} from '../common/constants/app.constants';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    public userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    this.logger.verbose(`Validando credenciais para e-mail: ${email}`);
    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn(
        `Tentativa de login falhou: Usuário "${email}" não encontrado.`,
      );
      return null;
    }
    if (!(await bcrypt.compare(pass, user.password))) {
      this.logger.warn(
        `Tentativa de login falhou: Senha incorreta para "${email}".`,
      );
      return null;
    }
    this.logger.log(`Usuário "${email}" autenticado com sucesso.`);
    return user;
  }

  async getTokens(userId: string, email: string) {
    this.logger.debug(`Gerando tokens JWT para usuário ID: ${userId}`);
    const payload: TokenPayload = { userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: JWT_ACCESS_TOKEN_EXPIRATION,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: JWT_REFRESH_TOKEN_EXPIRATION,
    });

    this.logger.debug('Tokens (access e refresh) gerados com sucesso.');
    return {
      accessToken,
      refreshToken,
    };
  }

  async login(user: User) {
    this.logger.log(`Processando login para usuário: ${user.email}`);
    const tokens = await this.getTokens(user.id, user.email);
    await this.userService.setCurrentRefreshToken(user.id, tokens.refreshToken);
    this.logger.log(
      `Login de "${user.email}" concluído. Refresh token atualizado no DB.`,
    );
    return tokens;
  }

  async logout(userId: string) {
    this.logger.log(`Processando logout para usuário ID: ${userId}`);
    await this.userService.removeRefreshToken(userId);
    this.logger.log(
      `Logout de usuário ID ${userId} concluído. Refresh token removido do DB.`,
    );
  }

  async refreshTokens(userId: string, email: string) {
    this.logger.log(`Processando refresh de tokens para usuário ID: ${userId}`);
    const tokens = await this.getTokens(userId, email);
    await this.userService.setCurrentRefreshToken(userId, tokens.refreshToken);
    this.logger.log(
      `Tokens de usuário ID ${userId} atualizados e refresh token no DB.`,
    );
    return tokens;
  }
}
