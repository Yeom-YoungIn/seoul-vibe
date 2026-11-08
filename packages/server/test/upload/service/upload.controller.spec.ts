/** 목적 - 업로드 저장소 연동 검증. 설명 - URL 형식과 저장 인자를 확인한다. */
import { Request } from 'express';
import { UploadController } from '../../../src/upload/service/upload.controller';

describe('업로드 컨트롤러', () => {
  const req = { protocol: 'http', get: () => 'localhost:3000' } as unknown as Request;
  const file = {
    originalname: 'TEST.JPG',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('img'),
  } as Express.Multer.File;
  it('저장소에 파일을 전달하고 로컬 경로를 기존 절대 URL로 반환한다', async () => {
    const put = jest.fn().mockResolvedValue('/uploads/file.jpg');
    const controller = new UploadController({ put });
    await expect(controller.uploadFile(file, req)).resolves.toEqual({
      url: 'http://localhost:3000/uploads/file.jpg',
    });
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f-]+\.jpg$/),
      file.buffer,
      'image/jpeg'
    );
  });
  it('S3 절대 URL은 호스트를 붙이지 않고 반환한다', async () => {
    const controller = new UploadController({
      put: jest.fn().mockResolvedValue('https://cdn.test/a.jpg'),
    });
    await expect(controller.uploadFile(file, req)).resolves.toEqual({
      url: 'https://cdn.test/a.jpg',
    });
  });
  it('파일이 없으면 저장하지 않고 오류를 반환한다', async () => {
    const put = jest.fn();
    await expect(
      new UploadController({ put }).uploadFile(undefined as unknown as Express.Multer.File, req)
    ).rejects.toThrow('파일이 없습니다.');
    expect(put).not.toHaveBeenCalled();
  });
});

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { JwtAuthGuard } from '@app/common';
import { STORAGE_SERVICE } from '../../../src/upload/storage/storage.service';

describe('업로드 파일 검증', () => {
  let app: INestApplication;
  const put = jest.fn().mockResolvedValue('https://cdn.test/a.jpg');
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: STORAGE_SERVICE, useValue: { put } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => app.close());
  beforeEach(() => put.mockClear());
  it('메모리로 받은 이미지 본문을 저장한다', async () => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('image'), { filename: 'a.png', contentType: 'image/png' })
      .expect(201);
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/\.png$/),
      Buffer.from('image'),
      'image/png'
    );
  });
  it.each([
    ['a.txt', 'image/png'],
    ['a.png', 'text/plain'],
  ])('확장자 또는 MIME이 잘못된 %s 파일을 거부한다', async (filename, contentType) => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('x'), { filename, contentType })
      .expect(400);
    expect(put).not.toHaveBeenCalled();
  });
  it('5MB를 초과하면 저장 전에 거부한다', async () => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'a.png',
        contentType: 'image/png',
      })
      .expect(413);
    expect(put).not.toHaveBeenCalled();
  });
});
