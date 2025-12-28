import { Language } from '@app/common';
import { Content } from '../shared/entities/content.entity';

export type GetContentListInput = {
  language?: Language;
  skip?: number;
  take?: number;
};

export type GetContentDetailInput = {
  slug: string;
  language?: Language;
};

export abstract class ContentServicePort {
  abstract getContentsList(input: GetContentListInput): Promise<[Content[], number]>;
  abstract getContentDetail(input: GetContentDetailInput): Promise<Content>;
}
