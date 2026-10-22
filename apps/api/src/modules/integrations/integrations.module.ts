import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RevalidationService } from './revalidation.service';

@Global()
@Module({
  providers: [NotificationService, RevalidationService],
  exports: [NotificationService, RevalidationService],
})
export class IntegrationsModule {}
