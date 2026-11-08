/**
 * 목적 - Neon과 기존 로컬 DB 연결을 함께 지원한다.
 * 설명 - URL을 우선하고 환경변수의 SSL 및 동기화 플래그를 명시적으로 해석한다.
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const buildTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const url = configService.get<string>('DATABASE_URL');
  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'] as const;
  const missing = required.filter((key) => !configService.get(key));

  if (!url && missing.length) {
    throw new Error(`Missing DB env vars: ${missing.join(', ')}`);
  }

  return {
    type: 'postgres',
    ...(url
      ? { url }
      : {
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get('DB_PORT')),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_NAME'),
        }),
    ...(String(configService.get('DB_SSL', false)) === 'true'
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
    autoLoadEntities: true,
    synchronize: String(configService.get('TYPEORM_SYNC', false)) === 'true',
    namingStrategy:
      configService.get<string>('DB_NAMING_STRATEGY') === 'snake'
        ? new SnakeNamingStrategy()
        : undefined,
  };
};
