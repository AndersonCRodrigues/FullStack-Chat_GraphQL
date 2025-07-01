import { UseGuards, Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './user.entity';
import { UserService } from './user.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UserResolver {
  private readonly logger: Logger = new Logger(UserResolver.name);

  constructor(private userService: UserService) {}

  @Mutation(() => User, {
    description:
      'Cria um novo usuário com nome, e-mail, CPF e senha. Requer autenticação (ex: por um administrador).',
  })
  @UseGuards(GqlAuthGuard)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> {
    this.logger.verbose(
      `Mutation: createUser - Input email: ${createUserInput.email}`,
    );
    return this.userService.createUserWithPassword(createUserInput);
  }

  @Query(() => [User], {
    description: 'Retorna uma lista de todos os usuários. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async users(): Promise<User[]> {
    this.logger.verbose('Query: users');
    return this.userService.findAll();
  }

  @Query(() => User, {
    description: 'Retorna um único usuário pelo ID. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async user(
    @Args('id', {
      type: () => ID,
      description: 'O ID do usuário a ser buscado.',
    })
    id: string,
  ): Promise<User> {
    this.logger.verbose(`Query: user - ID: ${id}`);
    return this.userService.findById(id);
  }

  @Query(() => User, {
    nullable: true,
    description:
      'Busca um único usuário pelo e-mail. Retorna null se não encontrado. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async userByEmail(
    @Args('email', {
      type: () => String,
      description: 'O e-mail do usuário a ser buscado.',
    })
    email: string,
  ): Promise<User | undefined> {
    this.logger.verbose(`Query: userByEmail - Email: ${email}`);
    const user = await this.userService.findByEmail(email);
    return user === null ? undefined : user;
  }

  @Query(() => User, {
    nullable: true,
    description:
      'Busca um único usuário pelo CPF. Retorna null se não encontrado. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async userByCpf(
    @Args('cpf', {
      type: () => String,
      description: 'O CPF do usuário a ser buscado.',
    })
    cpf: string,
  ): Promise<User | undefined> {
    this.logger.verbose(`Query: userByCpf - CPF: ${cpf}`);
    const user = await this.userService.findByCpf(cpf);
    return user === null ? undefined : user;
  }

  @Query(() => User, {
    description: 'Retorna o perfil do usuário atualmente autenticado.',
  })
  @UseGuards(GqlAuthGuard)
  async getMyProfile(@CurrentUser() user: User): Promise<User> {
    this.logger.verbose(`Query: getMyProfile - User ID from token: ${user.id}`);
    return this.userService.findById(user.id);
  }

  @Mutation(() => User, {
    description: 'Atualiza um usuário existente pelo ID. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('id', {
      type: () => ID,
      description: 'O ID do usuário a ser atualizado.',
    })
    id: string,
    @Args('updateUserInput', {
      description: 'Dados para atualização do usuário.',
    })
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    this.logger.verbose(
      `Mutation: updateUser - ID: ${id}, Input email: ${updateUserInput.email || 'N/A'}`,
    );
    return this.userService.updateUser(id, updateUserInput);
  }

  @Mutation(() => Boolean, {
    description:
      'Exclui um usuário existente pelo ID. Retorna true em caso de sucesso. Requer autenticação.',
  })
  @UseGuards(GqlAuthGuard)
  async deleteUser(
    @Args('id', {
      type: () => ID,
      description: 'O ID do usuário a ser excluído.',
    })
    id: string,
  ): Promise<boolean> {
    this.logger.verbose(`Mutation: deleteUser - ID: ${id}`);
    return this.userService.deleteUser(id);
  }
}
