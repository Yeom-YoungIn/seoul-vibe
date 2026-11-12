import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { buildTypeOrmConfig } from './typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => buildTypeOrmConfig(configService),
      inject: [ConfigService],
      // migrationsRun은 synchronize보다 먼저 돌아 빈 DB에서 실패하므로, 스키마 동기화 뒤에 직접 실행한다
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options!).initialize();
        // 실패 시 연결을 닫아야 TypeOrmModule 재시도마다 커넥션 풀이 쌓이지 않는다
        await dataSource.runMigrations().catch(async (err) => {
          await dataSource.destroy();
          throw err;
        });
        return dataSource;
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class OrmModule {}
