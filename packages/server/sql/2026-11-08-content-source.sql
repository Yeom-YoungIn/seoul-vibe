-- 목적 - 아티클 외부 원문 출처 컬럼을 TYPEORM_SYNC=false 환경(AWS dev, prod)에 반영하기 위해 추가됨
-- 설명 - 서버 배포 전에 실행한다. DB_NAMING_STRATEGY=snake 기준이며 IF NOT EXISTS라 재실행해도 안전하다.
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_url varchar(2048);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_type varchar(20);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_title varchar(300);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_description varchar(500);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_site_name varchar(100);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_author varchar(100);
ALTER TABLE contents ADD COLUMN IF NOT EXISTS source_image_path varchar(500);
