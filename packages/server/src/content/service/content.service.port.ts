import { Content } from '../shared/entities/content.entity';

export type GetContentListInput = {
  language?: 'KO' | 'EN';
  skip?: number;
  take?: number;
};

export abstract class ContentServicePort {
  abstract getContentsList(input: GetContentListInput): Promise<[Content[], number]>;
}
