import { Injectable } from '@nestjs/common';
import { CommonService } from 'sv/common';

@Injectable()
export class AppService {
  constructor(private readonly commonService: CommonService) {}

  getHello(): string {
    const welcome = this.commonService.formatWelcome('Seoul Vibe API');
    const timestamp = this.commonService.nowIso();
    return `${welcome} - ${timestamp}`;
  }
}
