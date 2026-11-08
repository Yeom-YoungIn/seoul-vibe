import { join } from 'path';

/** 업로드 파일 저장 루트. 빌드 후 dist/uploads, main.ts의 /uploads 정적 경로와 같은 위치 */
export const UPLOADS_ROOT = join(__dirname, '..', '..', 'uploads');
