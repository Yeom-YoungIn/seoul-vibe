import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

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
    entities: [
      // built JS output (production)
      join(__dirname, '../../**/*.entity.{ts,js}'),
      join(process.cwd(), 'dist/**/*.entity.js'),
      // source TS during dev
      join(process.cwd(), 'src/**/*.entity.{ts,js}'),
    ],
    migrations: [join(process.cwd(), 'dist/**/*.migration.js')],
  };
};
