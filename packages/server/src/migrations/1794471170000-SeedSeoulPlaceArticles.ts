/**
 * 목적 - 서울 장소 아티클 10개를 배포 시 자동으로 등록하기 위해 추가됨
 * 설명 - 엔티티 저장소로 넣어 DB_NAMING_STRATEGY와 무관하게 동작한다. 이미 있는 slug(삭제된 글 포함)는 건너뛰고, 검토 후 발행하도록 Draft로 넣는다.
 */
import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { Content } from '../content/shared/entities/content.entity';
import { ContentTranslation } from '../content/shared/entities/content-translations.entity';
import { sanitizeArticleHtml } from '../content/shared/sanitize-article-html';
import { SEOUL_PLACE_ARTICLES } from './seoul-place-articles.data';

export class SeedSeoulPlaceArticles1794471170000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const contents = queryRunner.manager.getRepository(Content);
    const translations = queryRunner.manager.getRepository(ContentTranslation);

    for (const article of SEOUL_PLACE_ARTICLES) {
      if (await contents.exists({ where: { slug: article.slug }, withDeleted: true })) continue;
      await contents.save(
        contents.create({
          slug: article.slug,
          translations: article.translations.map((t) =>
            translations.create({ ...t, bodyHtml: sanitizeArticleHtml(t.bodyHtml) })
          ),
        })
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .getRepository(Content)
      .delete({ slug: In(SEOUL_PLACE_ARTICLES.map((a) => a.slug)) });
  }
}
