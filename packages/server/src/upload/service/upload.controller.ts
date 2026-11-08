import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { JwtAuthGuard } from '@app/common';
import { UPLOADS_ROOT } from '../uploads-root';

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_MIME_PREFIX = 'image/';
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  @Post()
  @ApiOperation({ summary: '이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_ROOT,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!file.mimetype.startsWith(ALLOWED_MIME_PREFIX) || !ALLOWED_EXT.includes(ext)) {
          return cb(new BadRequestException('이미지 파일(jpg, png, gif, webp)만 허용됩니다.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('파일이 없습니다.');
    const base = `${req.protocol}://${req.get('host')}`;
    return { url: `${base}/uploads/${file.filename}` };
  }
}
