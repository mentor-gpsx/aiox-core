import { Module } from '@nestjs/common';
import { CommissionCalculatorService } from './commission-calculator.service';
import { CommissionCreationService } from './commission-creation.service';
import { AuditLoggerService } from '@/common/services';

@Module({
  providers: [CommissionCalculatorService, CommissionCreationService, AuditLoggerService],
  exports: [CommissionCalculatorService, CommissionCreationService],
})
export class CommissionsModule {}
