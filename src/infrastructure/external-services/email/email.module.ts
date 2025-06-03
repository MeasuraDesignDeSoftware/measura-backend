import { Module } from '@nestjs/common';
import { EmailService } from '@infrastructure/external-services/email/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
