import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminContentService {
  findAll() {
    // 관리자용 콘텐츠 관리 목록 (추후 DB 연동)
    return [{ id: 1, title: 'Admin content item', status: 'draft' }];
  }
}
