import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ContentServicePort,
  GetContentDetailInput,
  GetContentListInput,
} from './content.service.port';
import { DEFAULT_LANGUAGE } from '@app/common';
import { ContentNotFoundError } from '../shared/errors/content.errors';
import { Content } from '../shared/entities/content.entity';

@Injectable()
export class ServiceContentService implements ContentServicePort {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentTranslation)
    private readonly contentTranslationRepository: Repository<ContentTranslation>
  ) {}

  async getContentsList(input: GetContentListInput): Promise<[Content[], number]> {
    const { language = 'KO', skip = 0, take = 10 } = input;

    return this.contentRepository
      .createQueryBuilder('content')
      .innerJoinAndSelect('content.translations', 'translation', 'translation.locale = :language', {
        language,
      })
      .orderBy('content.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  async getContentDetail(input: GetContentDetailInput): Promise<Content> {
    const { slug, language = DEFAULT_LANGUAGE } = input;

    const content = await this.contentRepository
      .createQueryBuilder('content')
      .innerJoinAndSelect('content.translations', 'translation', 'translation.locale = :language', {
        language,
      })
      .where('content.slug = :slug', { slug })
      .getOne();

    if (!content) {
      throw new ContentNotFoundError();
    }

    return content;
  }
}
