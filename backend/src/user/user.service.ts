import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    this.logger.debug('Buscando todos os usuários.');
    return this.usersRepository.find();
  }

  async findById(id: string): Promise<User> {
    this.logger.debug(`Buscando usuário pelo ID: ${id}`);
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Buscando usuário pelo e-mail: ${email}`);
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    this.logger.debug(`Buscando usuário pelo CPF: ${cpf}`);
    return this.usersRepository.findOne({ where: { cpf } });
  }

  async createUserWithPassword(
    createUserInput: CreateUserInput,
  ): Promise<User> {
    this.logger.log(
      `Tentando criar usuário com e-mail: ${createUserInput.email}`,
    );

    const existingUserByEmail = await this.findByEmail(createUserInput.email);
    if (existingUserByEmail) {
      throw new BadRequestException('Email already in use.');
    }
    const existingUserByCpf = await this.findByCpf(createUserInput.cpf);
    if (existingUserByCpf) {
      throw new BadRequestException('CPF already in use.');
    }

    const hashedPassword = await bcrypt.hash(createUserInput.password, 10);
    const newUser = this.usersRepository.create({
      name: createUserInput.name,
      email: createUserInput.email,
      cpf: createUserInput.cpf,
      password: hashedPassword,
    });
    const savedUser = await this.usersRepository.save(newUser);
    this.logger.log(
      `Usuário "${savedUser.email}" (ID: ${savedUser.id}) criado com sucesso.`,
    );
    return savedUser;
  }

  async updateUser(
    id: string,
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    this.logger.log(`Tentando atualizar usuário com ID: ${id}`);
    const user = await this.findById(id);

    if (updateUserInput.email && updateUserInput.email !== user.email) {
      const existingUserWithNewEmail = await this.findByEmail(
        updateUserInput.email,
      );
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== user.id) {
        throw new BadRequestException(
          'New email is already in use by another user.',
        );
      }
      user.email = updateUserInput.email;
    }
    if (updateUserInput.cpf && updateUserInput.cpf !== user.cpf) {
      const existingUserWithNewCpf = await this.findByCpf(updateUserInput.cpf);
      if (existingUserWithNewCpf && existingUserWithNewCpf.id !== user.id) {
        throw new BadRequestException(
          'New CPF is already in use by another user.',
        );
      }
      user.cpf = updateUserInput.cpf;
    }

    if (updateUserInput.name !== undefined) {
      user.name = updateUserInput.name;
    }
    if (updateUserInput.password) {
      user.password = await bcrypt.hash(updateUserInput.password, 10);
    }

    const updatedUser = await this.usersRepository.save(user);
    this.logger.log(
      `Usuário "${updatedUser.email}" (ID: ${updatedUser.id}) atualizado com sucesso.`,
    );
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    this.logger.log(`Tentando deletar usuário com ID: ${id}`);
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }
    this.logger.log(`Usuário com ID "${id}" deletado com sucesso.`);
    return true;
  }

  async setCurrentRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    this.logger.debug(`Setando refresh token para usuário ID: ${userId}`);
    const hashedPassword = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      refreshToken: hashedPassword,
    });
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    userId: string,
  ): Promise<User | null> {
    this.logger.debug(`Verificando refresh token para usuário ID: ${userId}`);
    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user || !user.refreshToken) {
      this.logger.warn(`User ${userId} not found or has no refresh token.`);
      return null;
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
      this.logger.warn(`Refresh token mismatch for user ID: ${userId}.`);
      return null;
    }

    this.logger.debug(`Refresh token matched for user ID: ${userId}.`);
    return user;
  }

  async removeRefreshToken(userId: string): Promise<void> {
    this.logger.debug(`Removendo refresh token para usuário ID: ${userId}`);
    await this.usersRepository.update(userId, { refreshToken: undefined });
  }
}
