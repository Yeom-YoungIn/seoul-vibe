import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const buildTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME'] as const;
  const missing = required.filter((key) => !configService.get(key));

  if (missing.length) {
    throw new Error(`Missing DB env vars: ${missing.join(', ')}`);
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('TYPEORM_SYNC', false),
    namingStrategy:
      configService.get<string>('DB_NAMING_STRATEGY') === 'snake'
        ? new SnakeNamingStrategy()
        : undefined,
  };
};
