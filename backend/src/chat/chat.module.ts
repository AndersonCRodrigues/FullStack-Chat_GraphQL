// backend/src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { UserModule } from '../user/user.module';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { CHAT_ROOMS } from './constants/chat.constants';
import { Message } from './message.entity';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Message])],
  providers: [
    ChatService,
    ChatResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub<Record<string, any>>(),
    },
    {
      provide: 'CHAT_ROOMS',
      useValue: CHAT_ROOMS,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
