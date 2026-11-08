/**
 * 목적 - 업로드 이미지를 로컬 또는 S3 호환 저장소에 보관한다.
 * 설명 - 저장 결과의 공개 경로 계약을 공유하고 S3 자격 증명은 서버에서만 사용한다.
 */
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { UPLOADS_ROOT } from '../uploads-root';

export const STORAGE_SERVICE = Symbol('StorageService');
export interface StorageService {
  put(key: string, body: Buffer, contentType: string): Promise<string>;
}

export class LocalStorageService implements StorageService {
  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    void contentType; // 로컬 정적 서버가 파일 확장자로 MIME을 결정한다
    const path = join(UPLOADS_ROOT, key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, body);
    return `/uploads/${key}`;
  }
}

export class S3StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    const required = (key: string): string => {
      const value = config.get<string>(key);
      if (!value) throw new Error(`Missing storage env var: ${key}`);
      return value;
    };
    this.client = new S3Client({
      endpoint: required('S3_ENDPOINT'),
      region: required('S3_REGION'),
      credentials: {
        accessKeyId: required('S3_ACCESS_KEY_ID'),
        secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: String(config.get('S3_FORCE_PATH_STYLE', false)) === 'true',
    });
    this.bucket = required('S3_BUCKET');
    this.publicBaseUrl = required('S3_PUBLIC_BASE_URL').replace(/\/+$/, '');
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return `${this.publicBaseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }
}

export function createStorage(config: ConfigService): StorageService {
  const driver = config.get<string>('STORAGE_DRIVER', 'local');
  if (driver === 'local') return new LocalStorageService();
  if (driver === 's3') return new S3StorageService(config);
  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}
