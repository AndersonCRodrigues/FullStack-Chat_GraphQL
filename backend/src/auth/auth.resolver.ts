import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { REFRESH_TOKEN_COOKIE_NAME } from '../common/constants/app.constants';
import { GqlContext } from '../common/interfaces/gql-context.interface';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginInput, RegisterInput } from './dto/auth.input';
import { AuthOutput } from './dto/auth.output';
import { GqlAuthGuard } from './guards/jwt-auth.guard';
import { GqlRefreshAuthGuard } from './guards/jwt-refresh.guard';

@Resolver()
export class AuthResolver {
  private readonly logger = new Logger(AuthResolver.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Mutation(() => AuthOutput, {
    description: 'Registra um novo usuário no sistema.',
  })
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<AuthOutput> {
    this.logger.verbose(`Mutation: register - Email: ${registerInput.email}`);
    const newUser =
      await this.authService.userService.createUserWithPassword(registerInput);
    const tokens = await this.authService.login(newUser);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: newUser,
    };
  }

  @Mutation(() => AuthOutput, {
    description: 'Autentica um usuário e retorna tokens de acesso e refresh.',
  })
  async login(@Args('loginInput') loginInput: LoginInput): Promise<AuthOutput> {
    this.logger.verbose(`Mutation: login - Email: ${loginInput.email}`);
    const user = await this.authService.validateUser(
      loginInput.email,
      loginInput.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials provided.');
    }
    const tokens = await this.authService.login(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user,
    };
  }

  @Mutation(() => Boolean, {
    description:
      'Invalida o refresh token do usuário atual, efetivando o logout.',
  })
  @UseGuards(GqlAuthGuard)
  async logout(
    @CurrentUser() user: User,
    @Context() context: GqlContext,
  ): Promise<boolean> {
    this.logger.verbose(`Mutation: logout - User ID: ${user.id}`);
    await this.authService.logout(user.id);
    const refreshTokenName = this.configService.get<string>(
      REFRESH_TOKEN_COOKIE_NAME,
    );
    if (!refreshTokenName) {
      throw new Error(
        'Refresh token cookie name is not defined in configuration.',
      );
    }
    context.res.clearCookie(refreshTokenName, {
      path: '/auth',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    this.logger.debug(
      `Refresh token cookie "${refreshTokenName}" cleared for user ${user.id}.`,
    );
    return true;
  }

  @Mutation(() => AuthOutput, {
    description:
      'Gera um novo access token e refresh token usando um refresh token existente.',
  })
  @UseGuards(GqlRefreshAuthGuard)
  async refreshTokens(@CurrentUser() user: User): Promise<AuthOutput> {
    this.logger.verbose(`Mutation: refreshTokens - User ID: ${user.id}`);
    const tokens = await this.authService.refreshTokens(user.id, user.email);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user,
    };
  }
}
