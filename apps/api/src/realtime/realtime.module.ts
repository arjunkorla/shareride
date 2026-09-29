import { Global, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { RealtimeGateway } from './realtime.gateway'

// Global so chat/notifications/matching modules can inject RealtimeGateway
// without each declaring their own import of it — same pattern as
// PrismaModule.
@Global()
@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
