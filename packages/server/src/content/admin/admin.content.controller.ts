import { Controller, Get } from '@nestjs/common';
import { AdminContentService } from './admin.content.service';

@Controller('content/admin')
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get()
  listAdminContent() {
    return this.adminContentService.findAll();
  }
}
