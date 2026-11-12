import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { ContentNotFoundError } from '../shared/errors/content.errors';
import { ContentSourceDto, CreateContentDto } from './dto/request/create-content.dto';
import { normalizeSourceUrl } from './source/source-url';
import { sanitizeArticleHtml } from '../shared/sanitize-article-html';
import { ListAdminContentDto } from './dto/request/list-admin-content.dto';
import { UpdateContentDto } from './dto/request/update-content.dto';

const SOURCE_DETAIL_KEYS = [
  'sourceTitle',
  'sourceDescription',
  'sourceSiteName',
  'sourceAuthor',
  'sourceImagePath',
] as const;

@Injectable()
export class AdminContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentTranslation)
    private readonly translationRepository: Repository<ContentTranslation>,
  ) {}

  async create(dto: CreateContentDto): Promise<Content> {
    const existing = await this.contentRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({
        errorCode: 'SLUG_ALREADY_EXISTS',
        message: `Slug "${dto.slug}" already exists`,
      });
    }

    const content = this.contentRepository.create({
      slug: dto.slug,
      coverImageUrl: dto.coverImageUrl?.trim() || null,
    });
    this.applySource(content, dto);
    content.translations = dto.translations.map((t) =>
      this.translationRepository.create({
        locale: t.locale,
        title: t.title,
        bodyHtml: t.bodyHtml && sanitizeArticleHtml(t.bodyHtml),
        bodyText: t.bodyText,
      }),
    );

    return this.contentRepository.save(content);
  }

  async findAll(dto: ListAdminContentDto): Promise<[Content[], number]> {
    return this.contentRepository.findAndCount({
      where: dto.isPublished === undefined ? {} : { isPublished: dto.isPublished },
      relations: ['translations'],
      order: { createdAt: 'DESC' },
      skip: dto.skip ?? 0,
      take: dto.take ?? 20,
    });
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['translations'],
    });
    if (!content) throw new ContentNotFoundError();
    return content;
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    const content = await this.findOne(id);

    if (dto.slug && dto.slug !== content.slug) {
      const existing = await this.contentRepository.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException({
          errorCode: 'SLUG_ALREADY_EXISTS',
          message: `Slug "${dto.slug}" already exists`,
        });
      }
      content.slug = dto.slug;
    }

    this.applySource(content, dto);
    if (dto.coverImageUrl !== undefined) content.coverImageUrl = dto.coverImageUrl?.trim() || null;

    if (dto.translations?.length) {
      for (const t of dto.translations) {
        if (!t.locale) continue;
        const existing = content.translations.find((tr) => tr.locale === t.locale);
        if (existing) {
          if (t.title !== undefined) existing.title = t.title;
          if (t.bodyHtml !== undefined) existing.bodyHtml = sanitizeArticleHtml(t.bodyHtml);
          if (t.bodyText !== undefined) existing.bodyText = t.bodyText;
        } else {
          const newTranslation = this.translationRepository.create({
            locale: t.locale,
            title: t.title ?? '',
            bodyHtml: t.bodyHtml && sanitizeArticleHtml(t.bodyHtml),
            bodyText: t.bodyText,
            content,
          });
          content.translations.push(newTranslation);
        }
      }
    }

    return this.contentRepository.save(content);
  }

  /** sourceUrl: undefined → 유지, null/빈 문자열 → 전체 제거, 값 → 정규화 후 sourceType 재계산 */
  private applySource(content: Content, dto: ContentSourceDto): void {
    if (dto.sourceUrl === null || dto.sourceUrl?.trim() === '') {
      this.clearSource(content);
      return;
    }

    if (dto.sourceUrl !== undefined) {
      const normalized = normalizeSourceUrl(dto.sourceUrl);
      content.sourceUrl = normalized.url;
      content.sourceType = normalized.type;
    }

    for (const key of SOURCE_DETAIL_KEYS) {
      if (dto[key] !== undefined) content[key] = dto[key];
    }

    if (!content.sourceUrl) this.clearSource(content);
  }

  private clearSource(content: Content): void {
    content.sourceUrl = null;
    content.sourceType = null;
    for (const key of SOURCE_DETAIL_KEYS) content[key] = null;
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentRepository.softRemove(content);
  }

  async publish(id: string): Promise<Content> {
    const content = await this.findOne(id);
    if (content.isPublished) return content;
    content.isPublished = true;
    content.publishedAt = new Date();
    return this.contentRepository.save(content);
  }

  async unpublish(id: string): Promise<Content> {
    const content = await this.findOne(id);
    if (!content.isPublished) return content;
    content.isPublished = false;
    return this.contentRepository.save(content);
  }
}
