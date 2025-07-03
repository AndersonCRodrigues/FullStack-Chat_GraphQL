// src/common/plugins/ws-auth.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UserModule } from '../../user/user.module';
import { WebSocketAuthPlugin } from './ws-auth.plugin';

@Module({
  imports: [AuthModule, UserModule],
  providers: [WebSocketAuthPlugin],
  exports: [WebSocketAuthPlugin],
})
export class WebSocketAuthPluginModule {}
