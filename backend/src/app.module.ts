import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { GqlWsConnectionContext } from './common/interfaces/ws-gql.interface';
import { WebSocketAuthPluginModule } from './common/plugins/ws-auth.module';
import { WebSocketAuthPlugin } from './common/plugins/ws-auth.plugin';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

interface Connection {
  context?: Record<string, unknown>;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    WebSocketAuthPluginModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [
        AuthModule,
        UserModule,
        ChatModule,
        ConfigModule,
        WebSocketAuthPluginModule,
      ],
      inject: [WebSocketAuthPlugin],
      useFactory: (wsAuthPlugin: WebSocketAuthPlugin) => ({
        autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
        sortSchema: true,
        playground: process.env.NODE_ENV === 'development',
        context: ({
          req,
          res,
          connection,
        }: {
          req?: import('express').Request;
          res?: import('express').Response;
          connection?: Connection;
        }): Record<string, unknown> => {
          if (!req && !res && connection?.context) {
            return connection.context;
          }
          return { req, res };
        },
        subscriptions: {
          'graphql-ws': {
            onConnect: async (context) => {
              const typedContext = context as GqlWsConnectionContext;
              const user =
                await wsAuthPlugin.authenticateWebSocketConnection(
                  typedContext,
                );
              if (user) {
                return { user, ...typedContext.extra };
              }
              return false;
            },
          },
          'subscriptions-transport-ws': true,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [],
  providers: [WebSocketAuthPlugin],
})
export class AppModule {}
