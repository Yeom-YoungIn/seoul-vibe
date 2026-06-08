import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ContentServicePort,
  GetContentDetailInput,
  GetContentListInput,
} from './content.service.port';
import { DEFAULT_LANGUAGE } from '@app/common';
import { ContentNotFoundError } from '../shared/errors/content.errors';
import { Content } from '../shared/entities/content.entity';
import { IsNull } from 'typeorm';

@Injectable()
export class ServiceContentService implements ContentServicePort {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
  ) {}

  async getContentsList(input: GetContentListInput): Promise<[Content[], number]> {
    const { language = 'KO', skip = 0, take = 10 } = input;

    const [contents, count] = await this.contentRepository.findAndCount({
      where: {
        isPublished: true,
        deletedAt: IsNull(),
        translations: {
          locale: language,
        },
      },
      relations: {
        translations: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take,
    });

    return [
      contents.map((content) => {
        const translations = content.translations.filter((translation) => translation.locale === language);
        const primaryTranslation = translations[0];

        return {
          ...content,
          title: primaryTranslation?.title ?? '',
          translations,
        };
      }),
      count,
    ];
  }

  async getContentDetail(input: GetContentDetailInput): Promise<Content> {
    const { slug, language = DEFAULT_LANGUAGE } = input;

    const content = await this.contentRepository.findOne({
      where: {
        slug,
        isPublished: true,
        deletedAt: IsNull(),
        translations: {
          locale: language,
        },
      },
      relations: {
        translations: true,
      },
    });

    if (!content) {
      throw new ContentNotFoundError();
    }

    const translations = content.translations.filter((translation) => translation.locale === language);

    return {
      ...content,
      translations,
    };
  }
}
