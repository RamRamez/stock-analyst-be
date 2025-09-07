import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SharesController } from './shares.controller.js';
import { SharesService } from './shares.service.js';

@Module({
  imports: [HttpModule.register({ timeout: 10000 }), ScheduleModule.forRoot()],
  providers: [SharesService, PrismaService],
  controllers: [SharesController],
})
export class SharesModule {}
