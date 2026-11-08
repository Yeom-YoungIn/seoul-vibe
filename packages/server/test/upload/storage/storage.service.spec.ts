/** 목적 - 저장소 드라이버 계약 검증. 설명 - 로컬 저장과 S3 요청 및 선택을 검증한다. */
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  createStorage,
  LocalStorageService,
  S3StorageService,
} from '../../../src/upload/storage/storage.service';
import { UPLOADS_ROOT } from '../../../src/upload/uploads-root';
import { join } from 'path';

const env = {
  STORAGE_DRIVER: 's3',
  S3_ENDPOINT: 'https://storage.test/storage/v1/s3',
  S3_REGION: 'ap-southeast-1',
  S3_BUCKET: 'images',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_PUBLIC_BASE_URL: 'https://storage.test/storage/v1/object/public/images/',
  S3_FORCE_PATH_STYLE: 'true',
};
describe('이미지 저장소', () => {
  afterEach(() => jest.restoreAllMocks());
  it('드라이버가 없으면 로컬을 선택하고 S3 설정이면 S3를 선택한다', () => {
    expect(createStorage(new ConfigService({}))).toBeInstanceOf(LocalStorageService);
    expect(createStorage(new ConfigService(env))).toBeInstanceOf(S3StorageService);
  });
  it('알 수 없는 드라이버와 불완전한 S3 설정은 시작 시 거부한다', () => {
    expect(() => createStorage(new ConfigService({ STORAGE_DRIVER: 'other' }))).toThrow();
    expect(() => createStorage(new ConfigService({ STORAGE_DRIVER: 's3' }))).toThrow('S3_ENDPOINT');
  });
  it('로컬 파일을 기존 경로에 쓰고 상대 공개 경로를 반환한다', async () => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const write = jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const body = Buffer.from('image');
    await expect(new LocalStorageService().put('sources/a.jpg', body, 'image/jpeg')).resolves.toBe(
      '/uploads/sources/a.jpg'
    );
    expect(write).toHaveBeenCalledWith(join(UPLOADS_ROOT, 'sources/a.jpg'), body);
  });
  it('S3에 버킷과 키와 본문과 MIME을 보내고 공개 URL을 반환한다', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(() => Promise.resolve({}));
    const storage = new S3StorageService(new ConfigService(env));
    const body = Buffer.from('image');
    await expect(storage.put('sources/a.jpg', body, 'image/jpeg')).resolves.toBe(
      `${env.S3_PUBLIC_BASE_URL}sources/a.jpg`
    );
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'images',
      Key: 'sources/a.jpg',
      Body: body,
      ContentType: 'image/jpeg',
    });
  });
  it('S3 실패를 성공 URL로 숨기지 않는다', async () => {
    jest
      .spyOn(S3Client.prototype, 'send')
      .mockImplementation(() => Promise.reject(new Error('upload failed')));
    await expect(
      new S3StorageService(new ConfigService(env)).put('a.jpg', Buffer.from('x'), 'image/jpeg')
    ).rejects.toThrow('upload failed');
  });
});
