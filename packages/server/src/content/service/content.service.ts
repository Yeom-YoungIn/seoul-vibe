import { Injectable } from '@nestjs/common';
import { Content } from '../shared/entities/content.entity';
import { Repository } from 'typeorm';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ContentServicePort, GetContentListInput } from './content.service.port';

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
}
