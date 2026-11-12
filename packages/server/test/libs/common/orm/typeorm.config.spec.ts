/** 목적 - 배포 DB 설정 회귀 검증. 설명 - URL 우선순위와 로컬 폴백을 확인한다. */
import { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from '../../../../libs/common/src/orm/typeorm.config';
const build = (env: Record<string, unknown>) => buildTypeOrmConfig(new ConfigService(env));
describe('DB 연결 설정', () => {
  it('URL이 있으면 개별 DB 설정보다 우선한다', () => {
    expect(build({ DATABASE_URL: 'postgres://neon/db', DB_HOST: 'local' })).toMatchObject({
      url: 'postgres://neon/db',
    });
    expect(build({ DATABASE_URL: 'postgres://neon/db' })).not.toHaveProperty('host');
  });
  it('URL이 없으면 기존 DB 설정을 사용한다', () => {
    expect(
      build({ DB_HOST: 'localhost', DB_PORT: 5432, DB_USER: 'u', DB_PASS: 'p', DB_NAME: 'db' })
    ).toMatchObject({
      host: 'localhost',
      port: 5432,
      username: 'u',
      password: 'p',
      database: 'db',
    });
  });
  it('SSL과 동기화 문자열을 실제 불리언으로 해석한다', () => {
    expect(
      build({ DATABASE_URL: 'postgres://neon/db', DB_SSL: 'true', TYPEORM_SYNC: 'false' })
    ).toMatchObject({ ssl: { rejectUnauthorized: false }, synchronize: false });
    expect(
      build({ DATABASE_URL: 'postgres://neon/db', DB_SSL: 'false', TYPEORM_SYNC: 'true' })
    ).toMatchObject({ synchronize: true });
  });
  it('빌드된 마이그레이션 경로를 가리킨다', () => {
    const config = build({ DATABASE_URL: 'postgres://neon/db' });
    expect((config as { migrations: string[] }).migrations[0]).toMatch(/src\/migrations\/\*\.js$/);
  });
  it('URL과 필수 DB 설정이 없으면 에러를 던진다', () => {
    expect(() => build({})).toThrow('Missing DB env vars');
  });
});
