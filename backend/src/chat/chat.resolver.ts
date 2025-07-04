import { Logger, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';

import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { WsAuthGuard } from 'src/auth/guards/ws-auth.guard';
import { GqlWsContext } from '../common/interfaces/gql-context.interface';
import { User } from '../user/user.entity';
import { ChatService } from './chat.service';
import { CreateMessageInput } from './dto/create-message.input';
import { Message } from './message.entity';

interface MessageAddedPayload {
  messageAdded: Message;
}

@Resolver(() => Message)
export class ChatResolver {
  private readonly logger = new Logger(ChatResolver.name);

  constructor(private readonly chatService: ChatService) {}

  @Query(() => [Message])
  @UseGuards(GqlAuthGuard)
  async messages(
    @Args('roomId', {
      type: () => String,
      nullable: true,
    })
    roomId?: string,
  ): Promise<Message[]> {
    this.logger.verbose(`Query: messages - Room ID: ${roomId || 'all'}`);
    return this.chatService.getMessages(roomId);
  }

  @Mutation(() => Message)
  @UseGuards(GqlAuthGuard)
  async createMessage(
    @Args('createMessageInput') createMessageInput: CreateMessageInput,
    @CurrentUser() user: User,
  ): Promise<Message> {
    this.logger.verbose(
      `Mutation: createMessage - Room ID: ${createMessageInput.roomId}, User: ${user.email}`,
    );
    return this.chatService.createMessage(createMessageInput, user);
  }

  @Subscription(() => Message, {
    name: 'messageAdded',
    filter: (
      payload: { messageAdded: Message },
      variables: { roomId: string },
    ) => {
      return payload.messageAdded.roomId === variables.roomId;
    },
  })
  @UseGuards(WsAuthGuard)
  messageAdded(
    @Args('roomId', {
      type: () => String,
    })
    roomId: string,
    @Context() context: GqlWsContext,
  ): AsyncIterator<MessageAddedPayload> {
    const user = context.req?.extra?.request?.user;
    this.logger.verbose(
      `Subscription: messageAdded - Room ID: ${roomId}, User: ${user?.email ?? 'unknown'}`,
    );
    return this.chatService.messageAdded(
      roomId,
    ) as AsyncIterator<MessageAddedPayload>;
  }

  @Query(() => [String])
  @UseGuards(GqlAuthGuard)
  getAvailableRooms(): readonly string[] {
    this.logger.verbose('Query: getAvailableRooms');
    return this.chatService.getAvailableRooms();
  }
}
