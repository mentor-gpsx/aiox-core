import { Module } from '@nestjs/common';
import { HealthModule } from '@src/health/health.module';
import { AuthModule } from '@src/modules/auth/auth.module';

@Module({
  imports: [HealthModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
