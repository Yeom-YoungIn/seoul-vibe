import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UPLOADS_ROOT } from '../../../upload/uploads-root';
import { normalizeSourceUrl, SourceType } from './source-url';
import { safeFetch, SourceFetchFailedError } from './safe-fetch';
import { parseSourceMeta, SourceMeta } from './source-meta.parser';

export interface SourcePreviewResult {
  sourceUrl: string;
  sourceType: SourceType;
  sourceTitle: string | null;
  sourceDescription: string | null;
  sourceSiteName: string | null;
  sourceAuthor: string | null;
  sourceImagePath: string | null;
}

const HTML_MAX_BYTES = 2 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const EMPTY_META: SourceMeta = { title: null, description: null, siteName: null, author: null, imageUrl: null };

@Injectable()
export class SourcePreviewService {
  private readonly userAgent: string;

  constructor(configService: ConfigService) {
    const siteUrl = configService.get<string>('SITE_URL') ?? 'http://localhost:5173';
    this.userAgent = `SeoulVibeBot/1.0 (+${siteUrl})`;
  }

  async preview(rawUrl: string): Promise<SourcePreviewResult> {
    const normalized = normalizeSourceUrl(rawUrl);

    // 인스타그램은 서버 요청 시 로그인 벽이 뜨므로 공식 임베드에 맡긴다
    if (normalized.type === 'INSTAGRAM' || !normalized.fetchUrl) {
      return this.toResult(normalized.url, normalized.type, { ...EMPTY_META, siteName: 'Instagram' }, null);
    }

    const meta = await this.fetchMeta(normalized.fetchUrl);
    const imagePath = meta.imageUrl ? await this.saveThumbnail(meta.imageUrl) : null;
    return this.toResult(normalized.url, normalized.type, meta, imagePath);
  }

  private async fetchMeta(url: string): Promise<SourceMeta> {
    try {
      const res = await safeFetch(url, { maxBytes: HTML_MAX_BYTES, userAgent: this.userAgent });
      return parseSourceMeta(res.body.toString('utf8'), res.finalUrl);
    } catch (error) {
      if (error instanceof SourceFetchFailedError) return EMPTY_META;
      throw error;
    }
  }

  private async saveThumbnail(imageUrl: string): Promise<string | null> {
    try {
      const res = await safeFetch(imageUrl, { maxBytes: IMAGE_MAX_BYTES, userAgent: this.userAgent });
      const ext = IMAGE_EXT[res.contentType];
      if (!ext) return null;

      const dir = join(UPLOADS_ROOT, 'sources');
      const filename = `${randomUUID()}.${ext}`;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, filename), res.body);
      return `/uploads/sources/${filename}`;
    } catch {
      // 썸네일은 부가 정보라 어떤 실패(차단 포함)도 미리보기 전체를 막지 않는다
      return null;
    }
  }

  private toResult(
    sourceUrl: string,
    sourceType: SourceType,
    meta: SourceMeta,
    sourceImagePath: string | null,
  ): SourcePreviewResult {
    return {
      sourceUrl,
      sourceType,
      sourceTitle: meta.title,
      sourceDescription: meta.description,
      sourceSiteName: meta.siteName,
      sourceAuthor: meta.author,
      sourceImagePath,
    };
  }
}
