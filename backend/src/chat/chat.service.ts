import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindManyOptions,
  FindOptionsWhere,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import { User } from '../user/user.entity';
import {
  MESSAGE_ADDED_EVENT_BASE,
  MESSAGE_TTL_MINUTES,
} from './constants/chat.constants';
import { Message } from './message.entity';

interface CreateMessageInput {
  roomId: string;
  content: string;
}

interface MessageAddedPayload {
  messageAdded: Message;
}

interface MessageSubscriptionResult {
  messageAdded: Message;
}

interface TypedPubSub {
  publish(triggerName: string, payload: unknown): Promise<void>;
  asyncIterableIterator(triggers: string | string[]): AsyncIterator<unknown>;
}

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject('PUB_SUB') private readonly pubSub: TypedPubSub,
    @Inject('CHAT_ROOMS') private readonly chatRooms: readonly string[],
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'ChatService inicializado. Configurando limpeza de mensagens.',
    );
    await this.cleanupOldMessages();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupOldMessages(): Promise<void> {
    const now = new Date();
    try {
      const result: DeleteResult = await this.messageRepository.delete({
        expiresAt: LessThan(now),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Limpeza de mensagens: ${result.affected} mensagens antigas removidas.`,
        );
      }
    } catch (error: unknown) {
      this.handleError(
        error,
        'Falha ao executar a limpeza de mensagens antigas',
      );
    }
  }

  async createMessage(
    createMessageInput: CreateMessageInput,
    author: User,
  ): Promise<Message> {
    this.validateCreateMessageInput(createMessageInput);
    this.validateAuthor(author);

    this.logger.verbose(
      `Criando mensagem para sala "${createMessageInput.roomId}" de "${author.email}"`,
    );

    this.validateRoomExists(createMessageInput.roomId);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + MESSAGE_TTL_MINUTES);

    const newMessage = this.messageRepository.create({
      roomId: createMessageInput.roomId,
      content: createMessageInput.content,
      author: author,
      timestamp: new Date(),
      expiresAt: expiresAt,
    });

    const savedMessage: Message = await this.messageRepository.save(newMessage);

    this.logger.debug(
      `Mensagem ID ${savedMessage.id} salva na sala "${savedMessage.roomId}".`,
    );

    const eventName = `${MESSAGE_ADDED_EVENT_BASE}${savedMessage.roomId}`;
    const payload: MessageAddedPayload = { messageAdded: savedMessage };

    await this.pubSub.publish(eventName, payload);

    return savedMessage;
  }

  async getMessages(roomId?: string): Promise<Message[]> {
    const whereClause: FindOptionsWhere<Message> = {
      expiresAt: MoreThan(new Date()),
    };

    if (roomId) {
      this.validateRoomExists(roomId);
      whereClause.roomId = roomId;
    }

    const findOptions: FindManyOptions<Message> = {
      where: whereClause,
      order: {
        timestamp: 'ASC',
      },
      relations: ['author'],
    };

    const messages: Message[] = await this.messageRepository.find(findOptions);

    this.logger.debug(
      `Retornando ${messages.length} mensagens para sala "${roomId || 'todas'}"`,
    );

    return messages;
  }

  messageAdded(roomId: string): AsyncIterator<MessageSubscriptionResult> {
    this.validateRoomExists(roomId);

    this.logger.debug(`Criando iterador de subscription para sala "${roomId}"`);

    const eventName = `${MESSAGE_ADDED_EVENT_BASE}${roomId}`;
    return this.pubSub.asyncIterableIterator(
      eventName,
    ) as AsyncIterator<MessageSubscriptionResult>;
  }

  getAvailableRooms(): readonly string[] {
    this.logger.verbose('Listando salas disponíveis.');
    return this.chatRooms;
  }

  private validateCreateMessageInput(input: CreateMessageInput): void {
    if (!input || typeof input !== 'object') {
      this.logger.warn('createMessageInput é inválido ou não é um objeto');
      throw new BadRequestException(
        'Invalid message input: must be an object.',
      );
    }

    if (!input.roomId || typeof input.roomId !== 'string') {
      this.logger.warn('roomId é obrigatório e deve ser uma string');
      throw new BadRequestException(
        'Invalid message input: roomId is required and must be a string.',
      );
    }

    if (!input.content || typeof input.content !== 'string') {
      this.logger.warn('content é obrigatório e deve ser uma string');
      throw new BadRequestException(
        'Invalid message input: content is required and must be a string.',
      );
    }

    if (input.content.trim().length === 0) {
      this.logger.warn('content não pode estar vazio');
      throw new BadRequestException(
        'Invalid message input: content cannot be empty.',
      );
    }
  }

  private validateAuthor(author: User): void {
    if (!author || typeof author !== 'object') {
      this.logger.warn('author é obrigatório e deve ser um objeto User válido');
      throw new BadRequestException(
        'Invalid author: must be a valid User object.',
      );
    }

    if (!author.id) {
      this.logger.warn('author deve ter um ID válido');
      throw new BadRequestException('Invalid author: must have a valid ID.');
    }
  }

  private validateRoomExists(roomId: string): void {
    if (!this.chatRooms.includes(roomId)) {
      this.logger.warn(`Tentativa de acessar sala inexistente: "${roomId}"`);
      throw new BadRequestException(`Room "${roomId}" does not exist.`);
    }
  }

  private handleError(error: unknown, context: string): void {
    if (error instanceof Error) {
      this.logger.error(context, error.stack || error.message);
    } else if (typeof error === 'string') {
      this.logger.error(`${context}: ${error}`);
    } else {
      this.logger.error(
        `${context}: Um erro desconhecido ocorreu`,
        String(error),
      );
    }
  }
}
