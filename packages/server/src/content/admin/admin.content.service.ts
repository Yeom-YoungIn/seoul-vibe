import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { ContentNotFoundError } from '../shared/errors/content.errors';
import { CreateContentDto } from './dto/request/create-content.dto';
import { ListAdminContentDto } from './dto/request/list-admin-content.dto';
import { UpdateContentDto } from './dto/request/update-content.dto';

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

    const content = this.contentRepository.create({ slug: dto.slug });
    content.translations = dto.translations.map((t) =>
      this.translationRepository.create({
        locale: t.locale,
        title: t.title,
        bodyHtml: t.bodyHtml,
        bodyText: t.bodyText,
      }),
    );

    return this.contentRepository.save(content);
  }

  async findAll(dto: ListAdminContentDto): Promise<[Content[], number]> {
    const qb = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.translations', 'translation')
      .orderBy('content.createdAt', 'DESC')
      .skip(dto.skip ?? 0)
      .take(dto.take ?? 20);

    if (dto.isPublished !== undefined) {
      qb.andWhere('content.isPublished = :isPublished', { isPublished: dto.isPublished });
    }

    return qb.getManyAndCount();
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

    if (dto.translations?.length) {
      for (const t of dto.translations) {
        if (!t.locale) continue;
        const existing = content.translations.find((tr) => tr.locale === t.locale);
        if (existing) {
          if (t.title !== undefined) existing.title = t.title;
          if (t.bodyHtml !== undefined) existing.bodyHtml = t.bodyHtml;
          if (t.bodyText !== undefined) existing.bodyText = t.bodyText;
        } else {
          const newTranslation = this.translationRepository.create({
            locale: t.locale,
            title: t.title ?? '',
            bodyHtml: t.bodyHtml,
            bodyText: t.bodyText,
            content,
          });
          content.translations.push(newTranslation);
        }
      }
    }

    return this.contentRepository.save(content);
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
