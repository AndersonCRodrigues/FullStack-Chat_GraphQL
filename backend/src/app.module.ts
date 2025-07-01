import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { Context } from 'graphql-ws';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { ChatModule } from './chat/chat.module';
import { WebSocketAuthPluginModule } from './common/plugins/ws-auth.module';
import { WebSocketAuthPlugin } from './common/plugins/ws-auth.plugin';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { ChatService } from './chat/chat.service';

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
      inject: [
        AuthService,
        UserService,
        ChatService,
        ConfigService,
        WebSocketAuthPlugin,
      ],
      useFactory: (wsAuthPlugin: WebSocketAuthPlugin) => ({
        autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
        sortSchema: true,
        playground: process.env.NODE_ENV === 'development',
        context: ({
          req,
          res,
        }: {
          req: Request;
          res: Response;
        }): { req: Request; res: Response } => ({ req, res }),
        subscriptions: {
          'graphql-ws': {
            onConnect: async (
              context: Context<Record<string, unknown> | undefined, unknown>,
            ): Promise<boolean | Record<string, unknown>> => {
              const isAuthenticated =
                await wsAuthPlugin.authenticateWebSocketConnection(context);

              if (isAuthenticated) {
                return context.extra as Record<string, unknown>;
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
