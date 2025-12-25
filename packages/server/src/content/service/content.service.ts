import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceContentService {
  findAll() {
    // 사용자용 콘텐츠 목록 (추후 DB 연동)
    return [{ id: 1, title: 'Public content', published: true }];
  }
}
