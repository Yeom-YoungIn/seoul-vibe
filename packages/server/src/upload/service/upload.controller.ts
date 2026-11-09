/**
 * 목적 - 게시글 이미지를 설정된 저장소로 업로드한다.
 * 설명 - 메모리에서 검증한 파일을 저장하고 기존 URL 응답 계약을 유지한다.
 */
import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard } from '@app/common';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';

// 저장 시 Content-Type은 클라이언트 값이 아니라 확장자로 정한다 (image/svg+xml 위장 차단)
const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  @Post()
  @ApiOperation({ summary: '이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!file.mimetype.startsWith('image/') || !MIME_BY_EXT[ext]) {
          return cb(
            new BadRequestException('이미지 파일(jpg, png, gif, webp)만 허용됩니다.'),
            false
          );
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    const ext = extname(file.originalname).toLowerCase();
    const path = await this.storage.put(`${randomUUID()}${ext}`, file.buffer, MIME_BY_EXT[ext]);
    const base = `${req.protocol}://${req.get('host')}`;
    return { url: /^https?:\/\//.test(path) ? path : `${base}${path}` };
  }
}
