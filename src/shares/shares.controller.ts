import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SharesService } from './shares.service';

@Controller('shares')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60 } })
  findAll() {
    return this.sharesService.findAll();
  }

  @Get(':insCode')
  @Throttle({ default: { limit: 60, ttl: 60 } })
  findOne(@Param('insCode') insCode: string) {
    return this.sharesService.findOne(insCode);
  }
}
