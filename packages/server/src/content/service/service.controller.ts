import { Controller, Get } from '@nestjs/common';
import { ServiceContentService } from './service.service';

@Controller('content')
export class ServiceContentController {
  constructor(private readonly serviceContentService: ServiceContentService) {}

  @Get()
  listContent() {
    return this.serviceContentService.findAll();
  }
}
