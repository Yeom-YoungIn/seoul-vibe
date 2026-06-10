/**
 * 목적 - 기본 응답과 운영용 health check 엔드포인트를 제공하기 위해 수정됨
 * 설명 - 루트 메시지 외에 Kubernetes probe가 사용할 /health 응답을 함께 노출한다.
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string } {
    return { message: this.appService.getHello() };
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
