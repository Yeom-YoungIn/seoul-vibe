-- 목적 - 쓰이지 않는 refresh_tokens.token_hash를 서버가 더 이상 채우지 않게 되어 NOT NULL을 푼다
-- 설명 - 서버 배포 전에 실행한다. 기존 서버와도 호환되며 재실행해도 안전하다 (DB_NAMING_STRATEGY=snake 기준).
ALTER TABLE refresh_tokens ALTER COLUMN token_hash DROP NOT NULL;
-- 새 서버 배포가 끝난 뒤 정리용 (컬럼과 함께 인덱스도 지워진다):
-- ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS token_hash;
