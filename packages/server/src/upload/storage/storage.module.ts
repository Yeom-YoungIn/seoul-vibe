/**
 * 목적 - 업로드와 원문 썸네일에 동일한 저장소를 주입한다.
 * 설명 - 설정에 따라 선택한 구현을 명시적으로 가져오는 모듈에 제공한다.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createStorage, STORAGE_SERVICE } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [{ provide: STORAGE_SERVICE, inject: [ConfigService], useFactory: createStorage }],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
