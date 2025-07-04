import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/auth.module';
import { UserModule } from '../../user/user.module';
import { WebSocketAuthPlugin } from './ws-auth.plugin';

@Module({
  imports: [ConfigModule, AuthModule, UserModule],
  providers: [WebSocketAuthPlugin],
  exports: [WebSocketAuthPlugin],
})
export class WebSocketAuthPluginModule {}
