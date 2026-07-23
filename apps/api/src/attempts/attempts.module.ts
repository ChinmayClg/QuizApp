import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { GradingService } from './grading.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, GradingService],
  exports: [AttemptsService, GradingService],
})
export class AttemptsModule {}
